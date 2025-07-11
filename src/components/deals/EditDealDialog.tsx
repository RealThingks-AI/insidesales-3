
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Deal } from '@/hooks/useDeals';
import { useEditDealForm } from '@/hooks/useEditDealForm';
import { BasicDealFields } from './forms/BasicDealFields';
import { DiscussionsStageFields } from './forms/DiscussionsStageFields';
import { QualifiedStageFields } from './forms/QualifiedStageFields';
import { RFQStageFields } from './forms/RFQStageFields';
import { OfferedStageFields } from './forms/OfferedStageFields';
import { FinalStageFields } from './forms/FinalStageFields';
import { ExecutionFields } from './forms/ExecutionFields';

interface EditDealDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditDealDialog = ({ deal, open, onOpenChange, onSuccess }: EditDealDialogProps) => {
  const { formData, updateFormData } = useEditDealForm(deal);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dealData = {
        deal_name: formData.deal_name,
        stage: formData.stage,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: formData.currency,
        probability: formData.probability ? parseInt(formData.probability) : null,
        closing_date: formData.closing_date || null,
        description: formData.description || null,
        
        // Discussions stage
        customer_need_identified: formData.customer_need_identified,
        need_summary: formData.need_summary || null,
        decision_maker_present: formData.decision_maker_present,
        customer_agreed_on_need: formData.customer_agreed_on_need || null,
        discussion_notes: formData.discussion_notes || null,
        
        // Qualified stage
        nda_signed: formData.nda_signed,
        budget_confirmed: formData.budget_confirmed || null,
        supplier_portal_access: formData.supplier_portal_access || null,
        expected_deal_timeline_start: formData.expected_deal_timeline_start || null,
        expected_deal_timeline_end: formData.expected_deal_timeline_end || null,
        budget_holder: formData.budget_holder || null,
        decision_makers: formData.decision_makers || null,
        timeline: formData.timeline || null,
        supplier_portal_required: formData.supplier_portal_required,
        
        // RFQ stage
        rfq_value: formData.rfq_value ? parseFloat(formData.rfq_value) : null,
        rfq_document_url: formData.rfq_document_url || null,
        rfq_document_link: formData.rfq_document_link || null,
        product_service_scope: formData.product_service_scope || null,
        rfq_confirmation_note: formData.rfq_confirmation_note || null,
        
        // Offered stage
        proposal_sent_date: formData.proposal_sent_date || null,
        negotiation_status: formData.negotiation_status || null,
        decision_expected_date: formData.decision_expected_date || null,
        offer_sent_date: formData.offer_sent_date || null,
        revised_offer_notes: formData.revised_offer_notes || null,
        negotiation_notes: formData.negotiation_notes || null,
        
        // Final stages
        win_reason: formData.win_reason || null,
        loss_reason: formData.loss_reason || null,
        lost_to: formData.lost_to || null,
        drop_reason: formData.drop_reason || null,
        drop_summary: formData.drop_summary || null,
        learning_summary: formData.learning_summary || null,
        
        // Execution
        execution_started: formData.execution_started,
        begin_execution_date: formData.begin_execution_date || null,
        confirmation_note: formData.confirmation_note || null,
        
        // General
        internal_notes: formData.internal_notes || null,
        last_activity_time: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('deals')
        .update(dealData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal updated",
        description: "Deal has been successfully updated.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        variant: "destructive",
        title: "Error updating deal",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <BasicDealFields formData={formData} updateFormData={updateFormData} />
          <DiscussionsStageFields formData={formData} updateFormData={updateFormData} />
          <QualifiedStageFields formData={formData} updateFormData={updateFormData} />
          <RFQStageFields formData={formData} updateFormData={updateFormData} />
          <OfferedStageFields formData={formData} updateFormData={updateFormData} />
          <FinalStageFields formData={formData} updateFormData={updateFormData} />
          <ExecutionFields formData={formData} updateFormData={updateFormData} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDealDialog;
