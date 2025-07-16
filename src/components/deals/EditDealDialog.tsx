
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Deal, DEAL_STAGES, getStageIndex, canMoveToStage } from '@/hooks/useDeals';
import { useEditDealForm } from '@/hooks/useEditDealForm';
import { useStageBasedVisibility } from '@/hooks/useStageBasedVisibility';
import { BasicDealFields } from './forms/BasicDealFields';
import { DiscussionsStageFields } from './forms/DiscussionsStageFields';
import { QualifiedStageFields } from './forms/QualifiedStageFields';
import { RFQStageFields } from './forms/RFQStageFields';
import { OfferedStageFields } from './forms/OfferedStageFields';
import { FinalStageFields } from './forms/FinalStageFields';
import { ExecutionFields } from './forms/ExecutionFields';
import { LeadInformationSection } from './forms/LeadInformationSection';

interface EditDealDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onDelete?: (dealId: string) => void;
}

const EditDealDialog = ({ deal, open, onOpenChange, onSuccess, onDelete }: EditDealDialogProps) => {
  const { formData, updateFormData } = useEditDealForm(deal);
  const [loading, setLoading] = useState(false);
  const {
    showAllFields,
    setShowAllFields,
    isFieldVisible,
    isFieldReadOnly,
    canShowPreviousStageFields
  } = useStageBasedVisibility(deal);

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
        
        // Qualified stage
        nda_signed: formData.nda_signed,
        budget_confirmed: formData.budget_confirmed || null,
        supplier_portal_access: formData.supplier_portal_access || null,
        supplier_portal_required: formData.supplier_portal_required,
        expected_deal_timeline_start: formData.expected_deal_timeline_start || null,
        expected_deal_timeline_end: formData.expected_deal_timeline_end || null,
        budget_holder: formData.budget_holder || null,
        decision_makers: formData.decision_makers || null,
        timeline: formData.timeline || null,
        
        // RFQ stage
        rfq_value: formData.rfq_value ? parseFloat(formData.rfq_value) : null,
        rfq_document_url: formData.rfq_document_url || null,
        product_service_scope: formData.product_service_scope || null,
        rfq_confirmation_note: formData.rfq_confirmation_note || null,
        
        // Offered stage
        proposal_sent_date: formData.proposal_sent_date || null,
        negotiation_status: formData.negotiation_status || null,
        negotiation_notes: formData.negotiation_notes || null,
        decision_expected_date: formData.decision_expected_date || null,
        
        // Final stages
        win_reason: formData.win_reason || null,
        loss_reason: formData.loss_reason || null,
        drop_reason: formData.drop_reason || null,
        
        // Execution fields
        execution_started: formData.execution_started,
        begin_execution_date: formData.begin_execution_date || null,
        
        // General
        internal_notes: formData.internal_notes || null,
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

  const handleDelete = () => {
    if (onDelete) {
      onDelete(deal.id);
      onOpenChange(false);
    }
  };

  const getNextStage = () => {
    const currentIndex = getStageIndex(deal.stage);
    if (currentIndex < DEAL_STAGES.length - 1) {
      return DEAL_STAGES[currentIndex + 1];
    }
    return null;
  };

  const canMoveToNextStage = () => {
    const nextStage = getNextStage();
    if (!nextStage) return false;
    
    // Create a temporary deal object with current form data to check if requirements are met
    const tempDeal: Deal = {
      ...deal,
      deal_name: formData.deal_name,
      stage: formData.stage,
      amount: formData.amount ? parseFloat(formData.amount) : deal.amount,
      currency: formData.currency,
      probability: formData.probability ? parseInt(formData.probability) : deal.probability,
      closing_date: formData.closing_date || deal.closing_date,
      description: formData.description || deal.description,
      customer_need_identified: formData.customer_need_identified,
      need_summary: formData.need_summary || deal.need_summary,
      decision_maker_present: formData.decision_maker_present !== undefined ? formData.decision_maker_present : deal.decision_maker_present,
      customer_agreed_on_need: formData.customer_agreed_on_need as 'Yes' | 'No' | 'Partial' || deal.customer_agreed_on_need,
      // Include all stage-specific fields for proper validation
      nda_signed: formData.nda_signed !== undefined ? formData.nda_signed : deal.nda_signed,
      budget_confirmed: formData.budget_confirmed as 'Yes' | 'No' | 'Estimate Only' | undefined || deal.budget_confirmed,
      supplier_portal_access: formData.supplier_portal_access as 'Invited' | 'Approved' | 'Not Invited' | undefined || deal.supplier_portal_access,
      expected_deal_timeline_start: formData.expected_deal_timeline_start || deal.expected_deal_timeline_start,
      expected_deal_timeline_end: formData.expected_deal_timeline_end || deal.expected_deal_timeline_end,
      rfq_value: formData.rfq_value ? parseFloat(formData.rfq_value) : deal.rfq_value,
      rfq_document_url: formData.rfq_document_url || deal.rfq_document_url,
      product_service_scope: formData.product_service_scope || deal.product_service_scope,
      proposal_sent_date: formData.proposal_sent_date || deal.proposal_sent_date,
      negotiation_status: formData.negotiation_status as 'Ongoing' | 'Finalized' | 'Rejected' | undefined || deal.negotiation_status,
      decision_expected_date: formData.decision_expected_date || deal.decision_expected_date,
    };
    
    return canMoveToStage(tempDeal, nextStage);
  };

  const handleMoveToStage = async (targetStage: string) => {
    setLoading(true);
    try {
      const dealData = {
        deal_name: formData.deal_name,
        stage: targetStage, // Move to target stage
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
        
        // Qualified stage
        nda_signed: formData.nda_signed,
        budget_confirmed: formData.budget_confirmed || null,
        supplier_portal_access: formData.supplier_portal_access || null,
        supplier_portal_required: formData.supplier_portal_required,
        expected_deal_timeline_start: formData.expected_deal_timeline_start || null,
        expected_deal_timeline_end: formData.expected_deal_timeline_end || null,
        budget_holder: formData.budget_holder || null,
        decision_makers: formData.decision_makers || null,
        timeline: formData.timeline || null,
        
        // RFQ stage
        rfq_value: formData.rfq_value ? parseFloat(formData.rfq_value) : null,
        rfq_document_url: formData.rfq_document_url || null,
        product_service_scope: formData.product_service_scope || null,
        rfq_confirmation_note: formData.rfq_confirmation_note || null,
        
        // Offered stage
        proposal_sent_date: formData.proposal_sent_date || null,
        negotiation_status: formData.negotiation_status || null,
        negotiation_notes: formData.negotiation_notes || null,
        decision_expected_date: formData.decision_expected_date || null,
        
        // Final stages
        win_reason: formData.win_reason || null,
        loss_reason: formData.loss_reason || null,
        drop_reason: formData.drop_reason || null,
        
        // Execution fields
        execution_started: formData.execution_started,
        begin_execution_date: formData.begin_execution_date || null,
        
        // General
        internal_notes: formData.internal_notes || null,
      };

      const { error } = await supabase
        .from('deals')
        .update(dealData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deal moved to ${targetStage} stage successfully`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error moving deal to stage:', error);
      toast({
        variant: "destructive",
        title: "Error moving deal",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToNextStage = async () => {
    const nextStage = getNextStage();
    if (!nextStage) return;
    await handleMoveToStage(nextStage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lead Information Section */}
          <LeadInformationSection 
            dealId={deal.id} 
            relatedLeadId={deal.related_lead_id || undefined} 
          />
          
          <BasicDealFields 
            formData={formData} 
            updateFormData={updateFormData} 
            isFieldVisible={isFieldVisible}
            isFieldReadOnly={isFieldReadOnly}
            currentStage={deal.stage}
          />
          
          {/* View All Fields Toggle - Hidden for Discussions and Qualified stages */}
          {deal.stage !== 'Discussions' && deal.stage !== 'Qualified' && canShowPreviousStageFields && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border-t">
              <Switch
                id="show-all-fields"
                checked={showAllFields}
                onCheckedChange={setShowAllFields}
              />
              <Label htmlFor="show-all-fields" className="text-sm font-medium">
                View All Fields (Hidden fields are read-only)
              </Label>
            </div>
          )}

          {/* Stage-based Fields */}
          {isFieldVisible('customer_need_identified') && (
            <DiscussionsStageFields 
              formData={formData} 
              updateFormData={updateFormData}
              readOnly={isFieldReadOnly('customer_need_identified')}
            />
          )}
          
          {isFieldVisible('nda_signed') && (
            <QualifiedStageFields 
              formData={formData} 
              updateFormData={updateFormData}
              readOnly={isFieldReadOnly('nda_signed')}
            />
          )}
          
          {isFieldVisible('rfq_value') && (
            <RFQStageFields 
              formData={formData} 
              updateFormData={updateFormData}
              readOnly={isFieldReadOnly('rfq_value')}
            />
          )}
          
          {isFieldVisible('proposal_sent_date') && (
            <OfferedStageFields 
              formData={formData} 
              updateFormData={updateFormData}
              readOnly={isFieldReadOnly('proposal_sent_date')}
            />
          )}
          
          {(isFieldVisible('win_reason') || isFieldVisible('loss_reason') || isFieldVisible('drop_reason')) && (
            <FinalStageFields 
              formData={formData} 
              updateFormData={updateFormData}
              readOnly={isFieldReadOnly('win_reason')}
              stage={formData.stage}
            />
          )}
          
          {isFieldVisible('execution_started') && (
            <ExecutionFields 
              formData={formData} 
              updateFormData={updateFormData}
              readOnly={isFieldReadOnly('execution_started')}
            />
          )}

          <div className="flex justify-between items-center">
            {onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 min-w-fit"
              >
                Delete Deal
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Deal'}
              </Button>
              
              {/* Conditional stage progression buttons */}
              {deal.stage === 'Offered' ? (
                // Offered stage - show buttons dynamically based on negotiation status
                <>
                  {formData.negotiation_status === 'Ongoing' && (
                    // Ongoing shows no stage progression buttons, only Update Deal (which is already shown above)
                    null
                  )}
                  {formData.negotiation_status === 'Accepted' && (
                    <Button 
                      type="button" 
                      onClick={() => handleMoveToStage('Won')}
                      disabled={loading}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {loading ? 'Moving...' : 'Move to Won'}
                    </Button>
                  )}
                  {formData.negotiation_status === 'Rejected' && (
                    <Button 
                      type="button" 
                      onClick={() => handleMoveToStage('Lost')}
                      disabled={loading}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      {loading ? 'Moving...' : 'Move to Lost'}
                    </Button>
                  )}
                  {(formData.negotiation_status === 'Dropped' || formData.negotiation_status === 'No Response') && (
                    <Button 
                      type="button" 
                      onClick={() => handleMoveToStage('Dropped')}
                      disabled={loading}
                      className="bg-gray-600 text-white hover:bg-gray-700"
                    >
                      {loading ? 'Moving...' : 'Move to Dropped'}
                    </Button>
                  )}
                </>
              ) : !['Won', 'Lost', 'Dropped'].includes(deal.stage) ? (
                // Regular stage progression button for non-final stages only
                <Button 
                  type="button" 
                  onClick={handleMoveToNextStage}
                  disabled={loading || !getNextStage() || !canMoveToNextStage()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  title={
                    !getNextStage() 
                      ? "Deal is in final stage" 
                      : !canMoveToNextStage() 
                        ? "Complete required fields to move forward: Deal Name, Probability (%), Description/Lead Link, and all stage-specific fields" 
                        : `Move to ${getNextStage()}`
                  }
                >
                  {loading 
                    ? 'Moving...' 
                    : getNextStage() 
                      ? `Move to ${getNextStage()}` 
                      : 'Final Stage'
                  }
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDealDialog;
