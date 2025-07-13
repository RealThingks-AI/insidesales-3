import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { Deal, getStageRequirements, canMoveToStage, getStageCompletionStatus, DEAL_STAGES } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StagePanelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal;
  onSuccess: () => void;
}

const StagePanelDialog = ({ open, onOpenChange, deal, onSuccess }: StagePanelDialogProps) => {
  const [formData, setFormData] = useState<Partial<Deal>>(deal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllStageData, setShowAllStageData] = useState(false);
  const [selectedFinalStage, setSelectedFinalStage] = useState<'Won' | 'Lost' | 'Dropped' | null>(null);

  const requirements = getStageRequirements(deal.stage);
  const completionStatus = getStageCompletionStatus(formData as Deal);

  function getNextStage(currentStage: string): string {
    const currentIndex = DEAL_STAGES.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === DEAL_STAGES.length - 1) return currentStage;
    return DEAL_STAGES[currentIndex + 1];
  }

  const handleInputChange = (field: keyof Deal, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to update deals.",
        });
        return;
      }

      const updateData = {
        ...formData,
        modified_by: user.id
      };

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal updated successfully",
        description: "Your changes have been saved",
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
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeal = async () => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal deleted successfully",
        description: "The deal has been permanently removed",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast({
        variant: "destructive",
        title: "Error deleting deal",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndMoveToNextStage = async () => {
    const nextStage = getNextStage(deal.stage);
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to update deals.",
        });
        return;
      }

      // First, save the current form data without changing the stage
      const saveData = {
        ...formData,
        modified_by: user.id,
        // For Discussions stage - explicitly ensure boolean fields are properly set
        ...(deal.stage === 'Discussions' && {
          customer_need_identified: formData.customer_need_identified === true,
          decision_maker_present: formData.decision_maker_present === true,
          need_summary: formData.need_summary?.trim() || null,
          customer_agreed_on_need: formData.customer_agreed_on_need || null
        }),
        // For Qualified stage - ensure all required fields are set
        ...(deal.stage === 'Qualified' && {
          nda_signed: formData.nda_signed,
          budget_confirmed: formData.budget_confirmed || null,
          supplier_portal_access: formData.supplier_portal_access || null,
          expected_deal_timeline_start: formData.expected_deal_timeline_start || null,
          expected_deal_timeline_end: formData.expected_deal_timeline_end || null
        }),
        // For RFQ stage - ensure all required fields are set
        ...(deal.stage === 'RFQ' && {
          rfq_value: formData.rfq_value || null,
          rfq_document_url: formData.rfq_document_url?.trim() || null,
          product_service_scope: formData.product_service_scope?.trim() || null
        }),
        // For Offered stage - ensure all required fields are set
        ...(deal.stage === 'Offered' && {
          proposal_sent_date: formData.proposal_sent_date || null,
          negotiation_status: formData.negotiation_status || null,
          decision_expected_date: formData.decision_expected_date || null
        })
      };

      console.log('First saving current stage data:', saveData);

      // Save current stage data first
      const { error: saveError } = await supabase
        .from('deals')
        .update(saveData)
        .eq('id', deal.id);

      if (saveError) throw saveError;

      // Then attempt to move to next stage
      const updateData = {
        ...saveData,
        stage: nextStage
      };

      console.log('Now moving to next stage with data:', updateData);

      const { error: moveError } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', deal.id);

      if (moveError) throw moveError;

      toast({
        title: "Deal updated successfully",
        description: `Deal saved and moved to ${nextStage} stage`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving and moving deal:', error);
      toast({
        variant: "destructive",
        title: "Error updating deal",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveToFinalStage = async (finalStage: 'Won' | 'Lost' | 'Dropped') => {
    // Validate required fields for final stage
    if (finalStage === 'Lost' && (!formData.loss_reason || formData.loss_reason.trim() === '')) {
      toast({
        variant: "destructive",
        title: "Loss reason required",
        description: "Please select a loss reason before marking as Lost.",
      });
      return;
    }
    
    if (finalStage === 'Dropped' && (!formData.drop_reason || formData.drop_reason.trim() === '')) {
      toast({
        variant: "destructive",
        title: "Drop reason required",
        description: "Please provide a drop reason before marking as Dropped.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to update deals.",
        });
        return;
      }

      const updateData = {
        ...formData,
        stage: finalStage,
        modified_by: user.id
      };

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal updated successfully",
        description: `Deal marked as ${finalStage}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        variant: "destructive",
        title: "Error updating deal",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Discussions': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-yellow-100 text-yellow-800',
      'RFQ': 'bg-orange-100 text-orange-800',
      'Offered': 'bg-purple-100 text-purple-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Dropped': 'bg-gray-100 text-gray-600',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getCompletionIcon = () => {
    switch (completionStatus) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'incomplete':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const renderDiscussionsStageFields = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="customer_need_identified"
            checked={formData.customer_need_identified === true}
            onCheckedChange={(checked) => 
              handleInputChange('customer_need_identified', checked === true)
            }
          />
          <Label htmlFor="customer_need_identified" className="font-medium">
            Customer Need Identified <span className="text-red-500">*</span>
          </Label>
        </div>

        <div>
          <Label htmlFor="need_summary" className="font-medium">
            Need Summary <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="need_summary"
            value={formData.need_summary || ''}
            onChange={(e) => handleInputChange('need_summary', e.target.value)}
            placeholder="Describe the customer's identified needs..."
            rows={3}
            className="mt-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="decision_maker_present"
            checked={formData.decision_maker_present === true}
            onCheckedChange={(checked) => 
              handleInputChange('decision_maker_present', checked === true)
            }
          />
          <Label htmlFor="decision_maker_present" className="font-medium">
            Decision Maker Present <span className="text-red-500">*</span>
          </Label>
        </div>

        <div>
          <Label htmlFor="customer_agreed_on_need" className="font-medium">
            Customer Agreed on Need <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.customer_agreed_on_need || ''} 
            onValueChange={(value) => handleInputChange('customer_agreed_on_need', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select agreement status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderQualifiedStageFields = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="nda_signed"
            checked={formData.nda_signed === true}
            onCheckedChange={(checked) => 
              handleInputChange('nda_signed', checked === true)
            }
          />
          <Label htmlFor="nda_signed" className="font-medium">
            NDA Signed <span className="text-red-500">*</span>
          </Label>
        </div>

        <div>
          <Label htmlFor="budget_confirmed" className="font-medium">
            Budget Confirmed <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.budget_confirmed || ''} 
            onValueChange={(value) => handleInputChange('budget_confirmed', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select budget status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Estimate Only">Estimate Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="supplier_portal_access" className="font-medium">
            Supplier Portal Access <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.supplier_portal_access || ''} 
            onValueChange={(value) => handleInputChange('supplier_portal_access', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select portal access status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Invited">Invited</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Not Invited">Not Invited</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="font-medium">
            Expected Deal Timeline <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-4 mt-1">
            <div>
              <Label htmlFor="expected_deal_timeline_start" className="text-sm text-gray-600">
                Start Date
              </Label>
              <Input
                id="expected_deal_timeline_start"
                type="date"
                value={formData.expected_deal_timeline_start || ''}
                onChange={(e) => handleInputChange('expected_deal_timeline_start', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="expected_deal_timeline_end" className="text-sm text-gray-600">
                End Date
              </Label>
              <Input
                id="expected_deal_timeline_end"
                type="date"
                value={formData.expected_deal_timeline_end || ''}
                onChange={(e) => handleInputChange('expected_deal_timeline_end', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRFQStageFields = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="rfq_value" className="font-medium">
            RFQ Value <span className="text-red-500">*</span>
          </Label>
          <Input
            id="rfq_value"
            type="number"
            step="0.01"
            min="0"
            value={formData.rfq_value || ''}
            onChange={(e) => handleInputChange('rfq_value', parseFloat(e.target.value) || null)}
            placeholder="Enter RFQ value"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="rfq_document_url" className="font-medium">
            RFQ Document URL <span className="text-red-500">*</span>
          </Label>
          <Input
            id="rfq_document_url"
            type="url"
            value={formData.rfq_document_url || ''}
            onChange={(e) => handleInputChange('rfq_document_url', e.target.value)}
            placeholder="https://example.com/rfq-document.pdf"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide a URL to the RFQ document (Google Drive, Dropbox, etc.)
          </p>
        </div>

        <div>
          <Label htmlFor="product_service_scope" className="font-medium">
            Product/Service Scope <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="product_service_scope"
            value={formData.product_service_scope || ''}
            onChange={(e) => handleInputChange('product_service_scope', e.target.value)}
            placeholder="Define the scope of products/services for this RFQ..."
            rows={4}
            className="mt-1"
          />
        </div>
      </div>
    );
  };

  const renderOfferedStageFields = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="proposal_sent_date" className="font-medium">
            Proposal Sent Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="proposal_sent_date"
            type="date"
            value={formData.proposal_sent_date || ''}
            onChange={(e) => handleInputChange('proposal_sent_date', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="negotiation_status" className="font-medium">
            Negotiation Status <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.negotiation_status || ''} 
            onValueChange={(value) => handleInputChange('negotiation_status', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select negotiation status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Finalized">Finalized</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="decision_expected_date" className="font-medium">
            Decision Expected Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="decision_expected_date"
            type="date"
            value={formData.decision_expected_date || ''}
            onChange={(e) => handleInputChange('decision_expected_date', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    );
  };

  const renderFinalStageFields = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Move to Final Stage</h3>
        
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={selectedFinalStage === 'Won' ? 'default' : 'outline'}
            onClick={() => setSelectedFinalStage('Won')}
            className="w-full"
          >
            Won
          </Button>
          <Button
            variant={selectedFinalStage === 'Lost' ? 'default' : 'outline'}
            onClick={() => setSelectedFinalStage('Lost')}
            className="w-full"
          >
            Lost
          </Button>
          <Button
            variant={selectedFinalStage === 'Dropped' ? 'default' : 'outline'}
            onClick={() => setSelectedFinalStage('Dropped')}
            className="w-full"
          >
            Dropped
          </Button>
        </div>

        {selectedFinalStage === 'Won' && (
          <div>
            <Label htmlFor="win_reason">Win Reason (Optional)</Label>
            <Textarea
              id="win_reason"
              value={formData.win_reason || ''}
              onChange={(e) => handleInputChange('win_reason', e.target.value)}
              placeholder="What factors led to winning this deal?"
              rows={3}
              className="mt-1"
            />
          </div>
        )}

        {selectedFinalStage === 'Lost' && (
          <div>
            <Label htmlFor="loss_reason">Loss Reason <span className="text-red-500">*</span></Label>
            <Select 
              value={formData.loss_reason || ''} 
              onValueChange={(value) => handleInputChange('loss_reason', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select loss reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Budget">Budget</SelectItem>
                <SelectItem value="Competitor">Competitor</SelectItem>
                <SelectItem value="Timeline">Timeline</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedFinalStage === 'Dropped' && (
          <div>
            <Label htmlFor="drop_reason">Drop Reason <span className="text-red-500">*</span></Label>
            <Textarea
              id="drop_reason"
              value={formData.drop_reason || ''}
              onChange={(e) => handleInputChange('drop_reason', e.target.value)}
              placeholder="Explain why this deal was dropped..."
              rows={3}
              className="mt-1"
            />
          </div>
        )}
      </div>
    );
  };

  const isDiscussionsComplete = () => {
    const hasCustomerNeedIdentified = formData.customer_need_identified === true;
    const hasNeedSummary = formData.need_summary && formData.need_summary.trim().length > 0;
    const hasDecisionMakerPresent = formData.decision_maker_present === true;
    const hasCustomerAgreement = formData.customer_agreed_on_need && ['Yes', 'No', 'Partial'].includes(formData.customer_agreed_on_need);
    
    return hasCustomerNeedIdentified && hasNeedSummary && hasDecisionMakerPresent && hasCustomerAgreement;
  };

  const isQualifiedComplete = () => {
    const hasNdaSigned = formData.nda_signed !== null && formData.nda_signed !== undefined;
    const hasBudgetConfirmed = formData.budget_confirmed && ['Yes', 'No', 'Estimate Only'].includes(formData.budget_confirmed);
    const hasSupplierPortalAccess = formData.supplier_portal_access && ['Invited', 'Approved', 'Not Invited'].includes(formData.supplier_portal_access);
    const hasTimelineStart = formData.expected_deal_timeline_start && formData.expected_deal_timeline_start.trim().length > 0;
    const hasTimelineEnd = formData.expected_deal_timeline_end && formData.expected_deal_timeline_end.trim().length > 0;
    
    return hasNdaSigned && hasBudgetConfirmed && hasSupplierPortalAccess && hasTimelineStart && hasTimelineEnd;
  };

  const isRFQComplete = () => {
    const hasRfqValue = formData.rfq_value !== null && formData.rfq_value !== undefined && formData.rfq_value > 0;
    const hasRfqDocumentUrl = formData.rfq_document_url && formData.rfq_document_url.trim().length > 0;
    const hasProductServiceScope = formData.product_service_scope && formData.product_service_scope.trim().length > 0;
    
    console.log('RFQ completion check:', {
      hasRfqValue,
      hasRfqDocumentUrl,
      hasProductServiceScope,
      formData: {
        rfq_value: formData.rfq_value,
        rfq_document_url: formData.rfq_document_url,
        product_service_scope: formData.product_service_scope
      }
    });
    
    return hasRfqValue && hasRfqDocumentUrl && hasProductServiceScope;
  };

  const isOfferedComplete = () => {
    const hasProposalSentDate = formData.proposal_sent_date && formData.proposal_sent_date.trim().length > 0;
    const hasNegotiationStatus = formData.negotiation_status && ['Ongoing', 'Finalized', 'Rejected'].includes(formData.negotiation_status);
    const hasDecisionExpectedDate = formData.decision_expected_date && formData.decision_expected_date.trim().length > 0;
    
    console.log('Offered completion check:', {
      hasProposalSentDate,
      hasNegotiationStatus,
      hasDecisionExpectedDate,
      formData: {
        proposal_sent_date: formData.proposal_sent_date,
        negotiation_status: formData.negotiation_status,
        decision_expected_date: formData.decision_expected_date
      }
    });
    
    return hasProposalSentDate && hasNegotiationStatus && hasDecisionExpectedDate;
  };

  const isCurrentStageComplete = () => {
    switch (deal.stage) {
      case 'Discussions':
        return isDiscussionsComplete();
      case 'Qualified':
        return isQualifiedComplete();
      case 'RFQ':
        return isRFQComplete();
      case 'Offered':
        return isOfferedComplete();
      default:
        return true;
    }
  };

  const canMoveToFinalStage = () => {
    if (selectedFinalStage === 'Lost') {
      return formData.loss_reason && formData.loss_reason.trim().length > 0;
    }
    if (selectedFinalStage === 'Dropped') {
      return formData.drop_reason && formData.drop_reason.trim().length > 0;
    }
    if (selectedFinalStage === 'Won') {
      return true; // Win reason is optional
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{deal.deal_name}</DialogTitle>
            <div className="flex items-center gap-2">
              {getCompletionIcon()}
              <Badge className={getStageColor(deal.stage)}>
                {deal.stage}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* View All Stage Data Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all-data"
              checked={showAllStageData}
              onCheckedChange={setShowAllStageData}
            />
            <Label htmlFor="show-all-data">View All Stage Data</Label>
          </div>

          {/* Current Stage Fields */}
          {deal.stage === 'Discussions' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Discussions Stage Requirements
              </h3>
              {renderDiscussionsStageFields()}
            </div>
          )}

          {deal.stage === 'Qualified' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Qualified Stage Requirements
              </h3>
              {renderQualifiedStageFields()}
            </div>
          )}

          {deal.stage === 'RFQ' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                RFQ Stage Requirements
              </h3>
              {renderRFQStageFields()}
            </div>
          )}

          {deal.stage === 'Offered' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Offered Stage Requirements
              </h3>
              {renderOfferedStageFields()}
            </div>
          )}

          {/* Final Stage Selection for Offered stage */}
          {deal.stage === 'Offered' && renderFinalStageFields()}

          {/* Keep only Probability field visible */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability || ''}
                onChange={(e) => handleInputChange('probability', parseInt(e.target.value))}
                placeholder="Enter probability"
              />
            </div>
          </div>

          {/* All Stage Data (when toggled) - Read-only */}
          {showAllStageData && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">All Stage Data (Read-only)</h3>
              
              {/* Deal Information Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-4">Deal Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Deal Name</Label>
                    <p className="text-gray-600">{deal.deal_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Deal Value</Label>
                    <p className="text-gray-600">
                      {deal.amount ? new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: deal.currency || 'USD' 
                      }).format(deal.amount) : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label>Expected Closing Date</Label>
                    <p className="text-gray-600">{deal.closing_date || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <p className="text-gray-600 text-xs">{deal.description || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              {/* Stage-specific Data */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Discussions Stage Data */}
                <div>
                  <Label>Customer Need Identified</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.customer_need_identified ? 'Yes' : 'No'}</p>
                    {deal.customer_need_identified && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>Decision Maker Present</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.decision_maker_present ? 'Yes' : 'No'}</p>
                    {deal.decision_maker_present && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>Customer Agreement on Need</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.customer_agreed_on_need || 'Not specified'}</p>
                    {deal.customer_agreed_on_need && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>Need Summary</Label>
                  <p className="text-gray-600 text-xs">{deal.need_summary || 'Not provided'}</p>
                </div>
                
                {/* Qualified Stage Data */}
                <div>
                  <Label>NDA Signed</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.nda_signed ? 'Yes' : 'No'}</p>
                    {deal.nda_signed && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>Budget Confirmed</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.budget_confirmed || 'Not specified'}</p>
                    {deal.budget_confirmed && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>Supplier Portal Access</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.supplier_portal_access || 'Not specified'}</p>
                    {deal.supplier_portal_access && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>Expected Timeline</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 text-xs">
                      {deal.expected_deal_timeline_start && deal.expected_deal_timeline_end 
                        ? `${deal.expected_deal_timeline_start} to ${deal.expected_deal_timeline_end}`
                        : 'Not specified'}
                    </p>
                    {deal.expected_deal_timeline_start && deal.expected_deal_timeline_end && 
                      <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>

                {/* RFQ Stage Data */}
                <div>
                  <Label>RFQ Value</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">
                      {deal.rfq_value ? new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: deal.currency || 'USD' 
                      }).format(deal.rfq_value) : 'Not specified'}
                    </p>
                    {deal.rfq_value && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>RFQ Document</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 text-xs truncate">
                      {deal.rfq_document_url ? (
                        <a href={deal.rfq_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Document
                        </a>
                      ) : 'Not provided'}
                    </p>
                    {deal.rfq_document_url && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Product/Service Scope</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 text-xs">{deal.product_service_scope || 'Not provided'}</p>
                    {deal.product_service_scope && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>

                {/* Offered Stage Data */}
                <div>
                  <Label>Proposal Sent Date</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.proposal_sent_date || 'Not specified'}</p>
                    {deal.proposal_sent_date && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>Negotiation Status</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.negotiation_status || 'Not specified'}</p>
                    {deal.negotiation_status && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div>
                  <Label>Decision Expected Date</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{deal.decision_expected_date || 'Not specified'}</p>
                    {deal.decision_expected_date && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            {/* Delete Deal Button with Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Deal
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the deal "{deal.deal_name}" and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteDeal}
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete Deal'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Right-aligned action buttons */}
            <div className="flex space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {(deal.stage === 'Discussions' || deal.stage === 'Qualified' || deal.stage === 'RFQ') && (
                <Button 
                  onClick={handleSaveAndMoveToNextStage}
                  disabled={isSubmitting || !isCurrentStageComplete()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Saving...' : `Save & Move to ${getNextStage(deal.stage)}`}
                </Button>
              )}

              {deal.stage === 'Offered' && selectedFinalStage && (
                <Button 
                  onClick={() => handleMoveToFinalStage(selectedFinalStage)}
                  disabled={isSubmitting || !canMoveToFinalStage()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Saving...' : `Save & Move to ${selectedFinalStage}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StagePanelDialog;
