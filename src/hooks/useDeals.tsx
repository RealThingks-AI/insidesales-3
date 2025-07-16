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
      'Deal name filled',
      'Probability (%) specified',
      'Meeting description or linked lead',
      'Customer need identified',
      'Need summary documented',
      'Customer agreement on need status'
    ],
    'Qualified': [
      'Deal name filled',
      'Probability (%) specified',
      'Meeting description or linked lead',
      'NDA signed status',
      'Budget confirmation',
      'Supplier portal access status',
      'Deal timeline start date',
      'Deal timeline end date'
    ],
    'RFQ': [
      'Deal name filled',
      'Probability (%) specified', 
      'Meeting description or linked lead',
      'RFQ value specified',
      'RFQ document URL provided',
      'Product/service scope defined'
    ],
    'Offered': [
      'Deal name filled',
      'Probability (%) specified',
      'Meeting description or linked lead', 
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
  
  // Helper function to check if deal has linked lead data
  const hasBasicLeadInfo = () => {
    // Basic requirements: deal name, probability, and either description or linked lead
    return !!(deal.deal_name && deal.deal_name.trim().length > 0 &&
              deal.probability !== null && deal.probability !== undefined &&
              (deal.description || deal.related_lead_id));
  };
  
  // Check stage completion for forward moves
  switch (currentStage) {
    case 'Discussions':
      return !!(hasBasicLeadInfo() &&
                deal.customer_need_identified === true && 
                deal.need_summary && deal.need_summary.trim().length > 0 && 
                deal.customer_agreed_on_need && ['Yes', 'No', 'Partial'].includes(deal.customer_agreed_on_need));
    case 'Qualified':
      return !!(hasBasicLeadInfo() &&
                deal.nda_signed !== null && 
                deal.budget_confirmed && 
                deal.supplier_portal_access && 
                deal.expected_deal_timeline_start && 
                deal.expected_deal_timeline_end);
    case 'RFQ':
      return !!(hasBasicLeadInfo() &&
                deal.rfq_value && deal.rfq_value > 0 && 
                deal.rfq_document_url && deal.rfq_document_url.trim().length > 0 && 
                deal.product_service_scope && deal.product_service_scope.trim().length > 0);
    case 'Offered':
      return !!(hasBasicLeadInfo() &&
                deal.proposal_sent_date && 
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
  
  // Helper function to check basic requirements
  const checkBasicRequirements = () => {
    let basicCount = 0;
    if (deal.deal_name && deal.deal_name.trim().length > 0) basicCount++;
    if (deal.probability !== null && deal.probability !== undefined) basicCount++;
    if (deal.description || deal.related_lead_id) basicCount++;
    return basicCount;
  };
  
  switch (deal.stage) {
    case 'Discussions':
      let discussionsCount = checkBasicRequirements();
      if (deal.customer_need_identified === true) discussionsCount++;
      if (deal.need_summary && deal.need_summary.trim().length > 0) discussionsCount++;
      if (deal.customer_agreed_on_need && ['Yes', 'No', 'Partial'].includes(deal.customer_agreed_on_need)) discussionsCount++;
      completedCount = discussionsCount;
      break;
    case 'Qualified':
      let qualifiedCount = checkBasicRequirements();
      if (deal.nda_signed !== null) qualifiedCount++;
      if (deal.budget_confirmed) qualifiedCount++;
      if (deal.supplier_portal_access) qualifiedCount++;
      if (deal.expected_deal_timeline_start) qualifiedCount++;
      if (deal.expected_deal_timeline_end) qualifiedCount++;
      completedCount = qualifiedCount;
      break;
    case 'RFQ':
      let rfqCount = checkBasicRequirements();
      if (deal.rfq_value && deal.rfq_value > 0) rfqCount++;
      if (deal.rfq_document_url && deal.rfq_document_url.trim().length > 0) rfqCount++;
      if (deal.product_service_scope && deal.product_service_scope.trim().length > 0) rfqCount++;
      completedCount = rfqCount;
      break;
    case 'Offered':
      let offeredCount = checkBasicRequirements();
      if (deal.proposal_sent_date) offeredCount++;
      if (deal.negotiation_status) offeredCount++;
      if (deal.decision_expected_date) offeredCount++;
      completedCount = offeredCount;
      break;
    default:
      return 'complete';
  }
  
  if (completedCount === requirements.length) return 'complete';
  if (completedCount > 0) return 'partial';
  return 'incomplete';
};

// Helper function to get stage index for progression
export const getStageIndex = (stage: string): number => {
  return DEAL_STAGES.indexOf(stage);
};

// Helper function to get the highest stage a deal has reached
export const getHighestStageReached = (deal: Deal): string => {
  // If deal has fields from later stages filled, it means it has progressed through those stages
  const stageIndex = getStageIndex(deal.stage);
  let highestIndex = stageIndex;
  
  // Check if deal has completed later stage fields
  if (deal.proposal_sent_date || deal.negotiation_status || deal.decision_expected_date) {
    highestIndex = Math.max(highestIndex, getStageIndex('Offered'));
  }
  if (deal.rfq_value || deal.rfq_document_url || deal.product_service_scope) {
    highestIndex = Math.max(highestIndex, getStageIndex('RFQ'));
  }
  if (deal.nda_signed !== null || deal.budget_confirmed || deal.supplier_portal_access) {
    highestIndex = Math.max(highestIndex, getStageIndex('Qualified'));
  }
  if (deal.win_reason || deal.loss_reason || deal.drop_reason) {
    highestIndex = Math.max(highestIndex, getStageIndex(deal.stage)); // Final stages
  }
  
  return DEAL_STAGES[highestIndex];
};

// Helper function to determine visible stages for a set of deals
export const getVisibleStages = (deals: Deal[]): string[] => {
  // Always return all 7 stages to ensure full pipeline visibility
  return DEAL_STAGES;
};

// Helper function to determine if a field should be visible for a deal
export const isFieldVisibleForDeal = (deal: Deal, fieldKey: string): boolean => {
  const highestStage = getHighestStageReached(deal);
  const highestStageIndex = getStageIndex(highestStage);
  
  // Stage-specific field mapping
  const stageFields = {
    'Discussions': [
      'customer_need_identified', 'need_summary', 'decision_maker_present', 
      'customer_agreed_on_need', 'discussion_notes'
    ],
    'Qualified': [
      'nda_signed', 'budget_confirmed', 'supplier_portal_access',
      'expected_deal_timeline_start', 'expected_deal_timeline_end',
      'budget_holder', 'decision_makers', 'timeline', 'supplier_portal_required'
    ],
    'RFQ': [
      'rfq_value', 'rfq_document_url', 'rfq_document_link',
      'product_service_scope', 'rfq_confirmation_note'
    ],
    'Offered': [
      'proposal_sent_date', 'negotiation_status', 'decision_expected_date',
      'offer_sent_date', 'revised_offer_notes', 'negotiation_notes'
    ],
    'Won': ['win_reason', 'execution_started', 'begin_execution_date', 'confirmation_note'],
    'Lost': ['loss_reason', 'lost_to', 'learning_summary'],
    'Dropped': ['drop_reason', 'drop_summary']
  };
  
  // Basic fields are always visible
  const basicFields = [
    'deal_name', 'stage', 'amount', 'probability', 'closing_date', 
    'currency', 'description', 'modified_at', 'created_at',
    'internal_notes', 'related_lead_id', 'related_meeting_id'
  ];
  
  if (basicFields.includes(fieldKey)) {
    return true;
  }
  
  // Check if field belongs to a stage that the deal has reached
  for (let i = 0; i <= highestStageIndex; i++) {
    const stage = DEAL_STAGES[i];
    if (stageFields[stage]?.includes(fieldKey)) {
      return true;
    }
  }
  
  return false;
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
