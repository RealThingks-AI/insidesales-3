import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardData {
  contacts: any[];
  leads: any[];
  deals: any[];
  meetings: any[];
  loading: boolean;
  error: string | null;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    contacts: [],
    leads: [],
    deals: [],
    meetings: [],
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  const fetchAllData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [contactsRes, leadsRes, dealsRes, meetingsRes] = await Promise.all([
        supabase.from('contacts').select('*').order('created_time', { ascending: false }),
        supabase.from('leads').select('*').order('created_time', { ascending: false }),
        supabase.from('deals').select('*').order('created_at', { ascending: false }),
        supabase.from('meetings').select('*').order('date', { ascending: false }),
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      if (dealsRes.error) throw dealsRes.error;
      if (meetingsRes.error) throw meetingsRes.error;

      setData({
        contacts: contactsRes.data || [],
        leads: leadsRes.data || [],
        deals: dealsRes.data || [],
        meetings: meetingsRes.data || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data',
      }));
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllData();

    // Set up real-time subscriptions
    const contactsChannel = supabase
      .channel('contacts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contacts' },
        () => fetchAllData()
      )
      .subscribe();

    const leadsChannel = supabase
      .channel('leads-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchAllData()
      )
      .subscribe();

    const dealsChannel = supabase
      .channel('deals-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        () => fetchAllData()
      )
      .subscribe();

    const meetingsChannel = supabase
      .channel('meetings-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(dealsChannel);
      supabase.removeChannel(meetingsChannel);
    };
  }, []);

  return { ...data, refetch: fetchAllData };
};