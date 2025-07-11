import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Deal {
  id: string;
  deal_name: string;
  description?: string;
  related_lead_id?: string;
}

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  contact_owner?: string;
}

interface LeadOwner {
  id: string;
  full_name: string;
}

interface Meeting {
  id: string;
}

export const useMeetingDealContext = (
  dealId?: string,
  meeting?: Meeting | null | undefined
) => {
  const [dealInfo, setDealInfo] = useState<Deal | null>(null);
  const [linkedLead, setLinkedLead] = useState<Lead | null>(null);
  const [leadOwner, setLeadOwner] = useState<LeadOwner | null>(null);
  const [dealDescription, setDealDescription] = useState('');
  const [editableDealTitle, setEditableDealTitle] = useState('');
  const [editableLeadOwner, setEditableLeadOwner] = useState('');

  // Fetch deal and lead information when dealId is provided
  useEffect(() => {
    const fetchDealContext = async () => {
      if (dealId && meeting) {
        try {
          console.log('Fetching deal context for dealId:', dealId);
          
          // Fetch deal information
          const { data: deal, error: dealError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

          if (dealError) {
            console.error('Error fetching deal:', dealError);
            return;
          }

          console.log('Fetched deal:', deal);
          setDealInfo(deal);
          setDealDescription(deal.description || '');
          setEditableDealTitle(deal.deal_name || '');

          // Fetch linked lead if exists
          if (deal.related_lead_id) {
            const { data: lead, error: leadError } = await supabase
              .from('leads')
              .select('*')
              .eq('id', deal.related_lead_id)
              .single();

            if (leadError) {
              console.error('Error fetching lead:', leadError);
              return;
            }

            console.log('Fetched linked lead:', lead);
            setLinkedLead(lead);

            // Fetch lead owner if exists
            if (lead.contact_owner) {
              const { data: owner, error: ownerError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', lead.contact_owner)
                .single();

              if (!ownerError && owner) {
                setLeadOwner(owner);
                setEditableLeadOwner(owner.full_name);
              }
            }
          }
        } catch (error) {
          console.error('Error in fetchDealContext:', error);
        }
      }
    };

    fetchDealContext();
  }, [dealId, meeting]);

  return {
    dealInfo,
    linkedLead,
    leadOwner,
    dealDescription,
    editableDealTitle,
    editableLeadOwner,
    setDealDescription,
    setEditableDealTitle,
    setEditableLeadOwner
  };
};