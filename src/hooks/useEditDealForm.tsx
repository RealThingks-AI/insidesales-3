import { useState, useEffect } from 'react';
import { Deal } from '@/hooks/useDeals';

export const useEditDealForm = (deal: Deal) => {
  const [formData, setFormData] = useState({
    deal_name: '',
    stage: '',
    amount: '',
    currency: 'USD',
    probability: '',
    closing_date: '',
    description: '',
    
    // Discussions stage
    customer_need_identified: false,
    need_summary: '',
    decision_maker_present: false,
    customer_agreed_on_need: '',
    discussion_notes: '',
    
    // Qualified stage
    nda_signed: false,
    budget_confirmed: '',
    supplier_portal_access: '',
    expected_deal_timeline_start: '',
    expected_deal_timeline_end: '',
    budget_holder: '',
    decision_makers: '',
    timeline: '',
    supplier_portal_required: false,
    
    // RFQ stage
    rfq_value: '',
    rfq_document_url: '',
    rfq_document_link: '',
    product_service_scope: '',
    rfq_confirmation_note: '',
    
    // Offered stage
    proposal_sent_date: '',
    negotiation_status: '',
    decision_expected_date: '',
    offer_sent_date: '',
    revised_offer_notes: '',
    negotiation_notes: '',
    
    // Final stages
    win_reason: '',
    loss_reason: '',
    lost_to: '',
    drop_reason: '',
    drop_summary: '',
    learning_summary: '',
    
    // Execution
    execution_started: false,
    begin_execution_date: '',
    confirmation_note: '',
    
    // General
    internal_notes: '',
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        deal_name: deal.deal_name || '',
        stage: deal.stage || 'Discussions',
        amount: deal.amount?.toString() || '',
        currency: deal.currency || 'USD',
        probability: deal.probability?.toString() || '',
        closing_date: deal.closing_date || '',
        description: deal.description || '',
        
        // Discussions stage
        customer_need_identified: deal.customer_need_identified || false,
        need_summary: deal.need_summary || '',
        decision_maker_present: deal.decision_maker_present || false,
        customer_agreed_on_need: deal.customer_agreed_on_need || '',
        discussion_notes: deal.discussion_notes || '',
        
        // Qualified stage
        nda_signed: deal.nda_signed || false,
        budget_confirmed: deal.budget_confirmed || '',
        supplier_portal_access: deal.supplier_portal_access || '',
        expected_deal_timeline_start: deal.expected_deal_timeline_start || '',
        expected_deal_timeline_end: deal.expected_deal_timeline_end || '',
        budget_holder: deal.budget_holder || '',
        decision_makers: deal.decision_makers || '',
        timeline: deal.timeline || '',
        supplier_portal_required: deal.supplier_portal_required || false,
        
        // RFQ stage
        rfq_value: deal.rfq_value?.toString() || '',
        rfq_document_url: deal.rfq_document_url || '',
        rfq_document_link: deal.rfq_document_link || '',
        product_service_scope: deal.product_service_scope || '',
        rfq_confirmation_note: deal.rfq_confirmation_note || '',
        
        // Offered stage
        proposal_sent_date: deal.proposal_sent_date || '',
        negotiation_status: deal.negotiation_status || '',
        decision_expected_date: deal.decision_expected_date || '',
        offer_sent_date: deal.offer_sent_date || '',
        revised_offer_notes: deal.revised_offer_notes || '',
        negotiation_notes: deal.negotiation_notes || '',
        
        // Final stages
        win_reason: deal.win_reason || '',
        loss_reason: deal.loss_reason || '',
        lost_to: deal.lost_to || '',
        drop_reason: deal.drop_reason || '',
        drop_summary: deal.drop_summary || '',
        learning_summary: deal.learning_summary || '',
        
        // Execution
        execution_started: deal.execution_started || false,
        begin_execution_date: deal.begin_execution_date || '',
        confirmation_note: deal.confirmation_note || '',
        
        // General
        internal_notes: deal.internal_notes || '',
      });
    }
  }, [deal]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return { formData, updateFormData };
};