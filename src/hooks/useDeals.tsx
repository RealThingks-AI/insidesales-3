import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Deal {
  id: string;
  deal_name: string;
  stage: string;
  related_lead_id?: string;
  related_meeting_id?: string;
  amount?: number;
  currency?: string;
  probability?: number;
  closing_date?: string;
  description?: string;
  discussion_notes?: string;
  budget_holder?: string;
  decision_makers?: string;
  timeline?: string;
  nda_signed?: boolean;
  supplier_portal_required?: boolean;
  rfq_document_link?: string;
  rfq_confirmation_note?: string;
  offer_sent_date?: string;
  revised_offer_notes?: string;
  negotiation_notes?: string;
  execution_started?: boolean;
  lost_to?: string;
  lost_reason?: string;
  learning_summary?: string;
  drop_summary?: string;
  internal_notes?: string;
  last_activity_time?: string;
  confirmation_note?: string;
  begin_execution_date?: string;
  
  // New stage-specific fields
  customer_need_identified?: boolean;
  need_summary?: string;
  decision_maker_present?: boolean;
  customer_agreed_on_need?: 'Yes' | 'No' | 'Partial';
  budget_confirmed?: 'Yes' | 'No' | 'Estimate Only';
  supplier_portal_access?: 'Invited' | 'Approved' | 'Not Invited';
  expected_deal_timeline_start?: string;
  expected_deal_timeline_end?: string;
  rfq_value?: number;
  rfq_document_url?: string;
  product_service_scope?: string;
  proposal_sent_date?: string;
  negotiation_status?: 'Ongoing' | 'Finalized' | 'Rejected';
  decision_expected_date?: string;
  win_reason?: string;
  loss_reason?: 'Budget' | 'Competitor' | 'Timeline' | 'Other';
  drop_reason?: string;
  
  created_at: string;
  created_by: string;
  modified_at: string;
  modified_by?: string;
}

export const DEAL_STAGES = [
  'Discussions',
  'Qualified',
  'RFQ',
  'Offered',
  'Won',
  'Lost',
  'Dropped'
];

// Stage completion requirements helper
export const getStageRequirements = (stage: string): string[] => {
  const requirements: Record<string, string[]> = {
    'Discussions': [
      'Customer need identified',
      'Need summary documented',
      'Decision maker present confirmed',
      'Customer agreement on need status'
    ],
    'Qualified': [
      'NDA signed status',
      'Budget confirmation',
      'Supplier portal access status',
      'Deal timeline start date',
      'Deal timeline end date'
    ],
    'RFQ': [
      'RFQ value specified',
      'RFQ document URL provided',
      'Product/service scope defined'
    ],
    'Offered': [
      'Proposal sent date',
      'Negotiation status',
      'Decision expected date'
    ],
    'Lost': [
      'Loss reason specified'
    ],
    'Dropped': [
      'Drop reason documented'
    ]
  };
  
  return requirements[stage] || [];
};

// Check if a deal can move to the next stage - updated to match database validation exactly
export const canMoveToStage = (deal: Deal, targetStage: string): boolean => {
  const currentStage = deal.stage;
  
  // Allow direct moves to Won, Lost, or Dropped from any stage
  if (['Won', 'Lost', 'Dropped'].includes(targetStage)) {
    return true;
  }
  
  // Check stage completion for forward moves - matching database validation logic exactly
  switch (currentStage) {
    case 'Discussions':
      return !!(deal.customer_need_identified === true && 
               deal.need_summary && deal.need_summary.trim().length > 0 && 
               deal.decision_maker_present === true && 
               deal.customer_agreed_on_need && ['Yes', 'No', 'Partial'].includes(deal.customer_agreed_on_need));
    case 'Qualified':
      return !!(deal.nda_signed !== null && 
               deal.budget_confirmed && 
               deal.supplier_portal_access && 
               deal.expected_deal_timeline_start && 
               deal.expected_deal_timeline_end);
    case 'RFQ':
      return !!(deal.rfq_value && deal.rfq_value > 0 && 
               deal.rfq_document_url && deal.rfq_document_url.trim().length > 0 && 
               deal.product_service_scope && deal.product_service_scope.trim().length > 0);
    case 'Offered':
      return !!(deal.proposal_sent_date && 
               deal.negotiation_status && 
               deal.decision_expected_date);
    default:
      return true;
  }
};

// Get stage completion status - updated to match database validation exactly
export const getStageCompletionStatus = (deal: Deal): 'complete' | 'partial' | 'incomplete' => {
  const requirements = getStageRequirements(deal.stage);
  if (requirements.length === 0) return 'complete';
  
  let completedCount = 0;
  
  switch (deal.stage) {
    case 'Discussions':
      if (deal.customer_need_identified === true) completedCount++;
      if (deal.need_summary && deal.need_summary.trim().length > 0) completedCount++;
      if (deal.decision_maker_present === true) completedCount++;
      if (deal.customer_agreed_on_need && ['Yes', 'No', 'Partial'].includes(deal.customer_agreed_on_need)) completedCount++;
      break;
    case 'Qualified':
      if (deal.nda_signed !== null) completedCount++;
      if (deal.budget_confirmed) completedCount++;
      if (deal.supplier_portal_access) completedCount++;
      if (deal.expected_deal_timeline_start) completedCount++;
      if (deal.expected_deal_timeline_end) completedCount++;
      break;
    case 'RFQ':
      if (deal.rfq_value && deal.rfq_value > 0) completedCount++;
      if (deal.rfq_document_url && deal.rfq_document_url.trim().length > 0) completedCount++;
      if (deal.product_service_scope && deal.product_service_scope.trim().length > 0) completedCount++;
      break;
    case 'Offered':
      if (deal.proposal_sent_date) completedCount++;
      if (deal.negotiation_status) completedCount++;
      if (deal.decision_expected_date) completedCount++;
      break;
    default:
      return 'complete';
  }
  
  if (completedCount === requirements.length) return 'complete';
  if (completedCount > 0) return 'partial';
  return 'incomplete';
};

export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('modified_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to handle the database response
      const typedDeals = (data || []).map(deal => ({
        ...deal,
        customer_agreed_on_need: deal.customer_agreed_on_need as 'Yes' | 'No' | 'Partial' | undefined,
        budget_confirmed: deal.budget_confirmed as 'Yes' | 'No' | 'Estimate Only' | undefined,
        supplier_portal_access: deal.supplier_portal_access as 'Invited' | 'Approved' | 'Not Invited' | undefined,
        negotiation_status: deal.negotiation_status as 'Ongoing' | 'Finalized' | 'Rejected' | undefined,
        loss_reason: deal.loss_reason as 'Budget' | 'Competitor' | 'Timeline' | 'Other' | undefined
      })) as Deal[];
      
      setDeals(typedDeals);
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      toast({
        variant: "destructive",
        title: "Error fetching deals",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const refetchDeals = () => {
    fetchDeals();
  };

  useEffect(() => {
    fetchDeals();

    // Set up real-time subscription for deals
    const dealsSubscription = supabase
      .channel('deals-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deals'
      }, (payload) => {
        console.log('Real-time deal change:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newDeal = {
            ...payload.new,
            customer_agreed_on_need: payload.new.customer_agreed_on_need as 'Yes' | 'No' | 'Partial' | undefined,
            budget_confirmed: payload.new.budget_confirmed as 'Yes' | 'No' | 'Estimate Only' | undefined,
            supplier_portal_access: payload.new.supplier_portal_access as 'Invited' | 'Approved' | 'Not Invited' | undefined,
            negotiation_status: payload.new.negotiation_status as 'Ongoing' | 'Finalized' | 'Rejected' | undefined,
            loss_reason: payload.new.loss_reason as 'Budget' | 'Competitor' | 'Timeline' | 'Other' | undefined
          } as Deal;
          
          setDeals(prev => [newDeal, ...prev]);
          toast({
            title: "New deal added",
            description: `${newDeal.deal_name} has been added`,
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedDeal = {
            ...payload.new,
            customer_agreed_on_need: payload.new.customer_agreed_on_need as 'Yes' | 'No' | 'Partial' | undefined,
            budget_confirmed: payload.new.budget_confirmed as 'Yes' | 'No' | 'Estimate Only' | undefined,
            supplier_portal_access: payload.new.supplier_portal_access as 'Invited' | 'Approved' | 'Not Invited' | undefined,
            negotiation_status: payload.new.negotiation_status as 'Ongoing' | 'Finalized' | 'Rejected' | undefined,
            loss_reason: payload.new.loss_reason as 'Budget' | 'Competitor' | 'Timeline' | 'Other' | undefined
          } as Deal;
          
          setDeals(prev => prev.map(deal => 
            deal.id === updatedDeal.id ? { ...deal, ...updatedDeal } : deal
          ));
        } else if (payload.eventType === 'DELETE') {
          setDeals(prev => prev.filter(deal => deal.id !== payload.old.id));
          toast({
            title: "Deal deleted",
            description: "A deal has been removed",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dealsSubscription);
    };
  }, []);

  return {
    deals,
    loading,
    fetchDeals,
    refetchDeals,
  };
};
