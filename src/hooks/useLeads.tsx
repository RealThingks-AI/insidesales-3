
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LeadColumn } from '@/components/LeadColumnCustomizer';

interface Lead {
  id: string;
  lead_name: string;
  company_name: string;
  position: string;
  email: string;
  phone_no: string;
  mobile_no: string;
  linkedin: string;
  website: string;
  contact_source: string;
  lead_status: string;
  industry: string;
  created_by: string;
  modified_by: string;
  created_time: string;
  modified_time: string;
  city: string;
  country: string;
  description: string;
  contact_owner: string;
  lead_owner_name?: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [columns, setColumns] = useState<LeadColumn[]>([
    { key: 'lead_name', label: 'Lead Name', required: true, visible: true },
    { key: 'company_name', label: 'Company Name', required: true, visible: true },
    { key: 'position', label: 'Position', required: true, visible: true },
    { key: 'email', label: 'Email', required: true, visible: true },
    { key: 'phone_no', label: 'Phone', required: true, visible: true },
    { key: 'lead_status', label: 'Lead Status', required: true, visible: true },
    { key: 'lead_owner_name', label: 'Lead Owner', required: false, visible: true },
    { key: 'mobile_no', label: 'Mobile', required: false, visible: false },
    { key: 'linkedin', label: 'LinkedIn', required: false, visible: false },
    { key: 'website', label: 'Website', required: false, visible: false },
    { key: 'industry', label: 'Industry', required: false, visible: false },
    { key: 'city', label: 'City', required: false, visible: false },
    { key: 'country', label: 'Country', required: false, visible: false },
    { key: 'contact_source', label: 'Source', required: false, visible: false },
  ]);

  const fetchLeads = async () => {
    try {
      // First, fetch all leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false });

      if (leadsError) throw leadsError;
      
      if (leadsData && leadsData.length > 0) {
        // Get unique user IDs from leads (contact_owner, created_by, modified_by)
        const userIds = new Set<string>();
        leadsData.forEach(lead => {
          if (lead.contact_owner) userIds.add(lead.contact_owner);
          if (lead.created_by) userIds.add(lead.created_by);
          if (lead.modified_by) userIds.add(lead.modified_by);
        });

        // Fetch user display names using edge function
        const userMap = new Map<string, string>();
        
        try {
          const { data, error } = await supabase.functions.invoke('get-user-display-names', {
            body: { userIds: Array.from(userIds) }
          });

          if (error) {
            console.error('Error fetching user display names:', error);
          } else if (data?.userDisplayNames) {
            Object.entries(data.userDisplayNames).forEach(([userId, displayName]) => {
              userMap.set(userId, displayName as string);
            });
          }
        } catch (functionError) {
          console.error('Error calling get-user-display-names function:', functionError);
          // Fallback: create placeholder names
          userIds.forEach(userId => {
            userMap.set(userId, 'Unknown User');
          });
        }

        // Transform leads to include proper display names
        const transformedLeads = leadsData.map(lead => ({
          ...lead,
          lead_owner_name: lead.contact_owner ? 
                          (userMap.get(lead.contact_owner) || 'Unknown User') : 
                          'No Owner'
        }));
        
        setLeads(transformedLeads);
      } else {
        setLeads([]);
      }
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        variant: "destructive",
        title: "Error fetching leads",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    // Set up real-time subscription for leads
    const leadsSubscription = supabase
      .channel('leads-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, (payload) => {
        console.log('Real-time lead change:', payload);
        
        if (payload.eventType === 'INSERT') {
          setLeads(prev => [payload.new as Lead, ...prev]);
          toast({
            title: "New lead added",
            description: `${(payload.new as Lead).lead_name} has been added`,
          });
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(lead => 
            lead.id === payload.new.id 
              ? { ...lead, ...(payload.new as Lead) }
              : lead
          ));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
          toast({
            title: "Lead deleted",
            description: "A lead has been removed",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsSubscription);
    };
  }, []);

  return {
    leads,
    loading,
    columns,
    setColumns,
    fetchLeads,
  };
};
