
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Deal, getStageRequirements, canMoveToStage } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StageRequirementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal;
  targetStage: string;
  onSuccess: () => void;
}

const StageRequirementsDialog = ({ 
  open, 
  onOpenChange, 
  deal, 
  targetStage, 
  onSuccess 
}: StageRequirementsDialogProps) => {
  const [formData, setFormData] = useState<Partial<Deal>>(deal);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requirements = getStageRequirements(deal.stage);
  const canMove = canMoveToStage(formData as Deal, targetStage);

  const handleInputChange = (field: keyof Deal, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
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
        stage: targetStage,
        modified_by: user.id
      };

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal updated successfully",
        description: `Deal moved to ${targetStage} stage`,
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

  const renderStageFields = () => {
    switch (deal.stage) {
      case 'Discussions':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customer_need_identified"
                checked={formData.customer_need_identified || false}
                onCheckedChange={(checked) => 
                  handleInputChange('customer_need_identified', checked)
                }
              />
              <Label htmlFor="customer_need_identified">Customer need identified</Label>
            </div>

            <div>
              <Label htmlFor="need_summary">Need Summary</Label>
              <Textarea
                id="need_summary"
                value={formData.need_summary || ''}
                onChange={(e) => handleInputChange('need_summary', e.target.value)}
                placeholder="Describe the customer's identified needs..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="decision_maker_present"
                checked={formData.decision_maker_present || false}
                onCheckedChange={(checked) => 
                  handleInputChange('decision_maker_present', checked)
                }
              />
              <Label htmlFor="decision_maker_present">Decision maker present</Label>
            </div>

            <div>
              <Label htmlFor="customer_agreed_on_need">Customer Agreement on Need</Label>
              <Select 
                value={formData.customer_agreed_on_need || ''} 
                onValueChange={(value) => handleInputChange('customer_agreed_on_need', value)}
              >
                <SelectTrigger>
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

      case 'Qualified':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="nda_signed"
                checked={formData.nda_signed || false}
                onCheckedChange={(checked) => 
                  handleInputChange('nda_signed', checked)
                }
              />
              <Label htmlFor="nda_signed">NDA signed</Label>
            </div>

            <div>
              <Label htmlFor="budget_confirmed">Budget Confirmation</Label>
              <Select 
                value={formData.budget_confirmed || ''} 
                onValueChange={(value) => handleInputChange('budget_confirmed', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="supplier_portal_access">Supplier Portal Access</Label>
              <Select 
                value={formData.supplier_portal_access || ''} 
                onValueChange={(value) => handleInputChange('supplier_portal_access', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select portal status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Invited">Invited</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Not Invited">Not Invited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expected_deal_timeline_start">Timeline Start</Label>
                <Input
                  id="expected_deal_timeline_start"
                  type="date"
                  value={formData.expected_deal_timeline_start || ''}
                  onChange={(e) => handleInputChange('expected_deal_timeline_start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expected_deal_timeline_end">Timeline End</Label>
                <Input
                  id="expected_deal_timeline_end"
                  type="date"
                  value={formData.expected_deal_timeline_end || ''}
                  onChange={(e) => handleInputChange('expected_deal_timeline_end', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'RFQ':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rfq_value">RFQ Value</Label>
              <Input
                id="rfq_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.rfq_value || ''}
                onChange={(e) => handleInputChange('rfq_value', parseFloat(e.target.value) || null)}
                placeholder="Enter RFQ value"
              />
            </div>

            <div>
              <Label htmlFor="rfq_document_url">RFQ Document URL</Label>
              <Input
                id="rfq_document_url"
                type="url"
                value={formData.rfq_document_url || ''}
                onChange={(e) => handleInputChange('rfq_document_url', e.target.value)}
                placeholder="https://example.com/rfq-document.pdf"
              />
            </div>

            <div>
              <Label htmlFor="product_service_scope">Product/Service Scope</Label>
              <Textarea
                id="product_service_scope"
                value={formData.product_service_scope || ''}
                onChange={(e) => handleInputChange('product_service_scope', e.target.value)}
                placeholder="Define the scope of products/services..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'Offered':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposal_sent_date">Proposal Sent Date</Label>
              <Input
                id="proposal_sent_date"
                type="date"
                value={formData.proposal_sent_date || ''}
                onChange={(e) => handleInputChange('proposal_sent_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="negotiation_status">Negotiation Status</Label>
              <Select 
                value={formData.negotiation_status || ''} 
                onValueChange={(value) => handleInputChange('negotiation_status', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="decision_expected_date">Decision Expected Date</Label>
              <Input
                id="decision_expected_date"
                type="date"
                value={formData.decision_expected_date || ''}
                onChange={(e) => handleInputChange('decision_expected_date', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFinalStageFields = () => {
    if (targetStage === 'Lost') {
      return (
        <div>
          <Label htmlFor="loss_reason">Loss Reason *</Label>
          <Select 
            value={formData.loss_reason || ''} 
            onValueChange={(value) => handleInputChange('loss_reason', value)}
          >
            <SelectTrigger>
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
      );
    }

    if (targetStage === 'Dropped') {
      return (
        <div>
          <Label htmlFor="drop_reason">Drop Reason *</Label>
          <Textarea
            id="drop_reason"
            value={formData.drop_reason || ''}
            onChange={(e) => handleInputChange('drop_reason', e.target.value)}
            placeholder="Explain why this deal was dropped..."
            rows={3}
          />
        </div>
      );
    }

    if (targetStage === 'Won') {
      return (
        <div>
          <Label htmlFor="win_reason">Win Reason</Label>
          <Textarea
            id="win_reason"
            value={formData.win_reason || ''}
            onChange={(e) => handleInputChange('win_reason', e.target.value)}
            placeholder="What factors led to winning this deal?"
            rows={3}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Move Deal to {targetStage}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Stage Requirements */}
          {requirements.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Complete {deal.stage} Stage Requirements
              </h3>
              <div className="space-y-2">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {canMove ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage-specific form fields */}
          {renderStageFields()}

          {/* Final stage specific fields */}
          {['Won', 'Lost', 'Dropped'].includes(targetStage) && renderFinalStageFields()}

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {canMove ? (
              <Badge className="bg-green-100 text-green-800">
                Ready to move to {targetStage}
              </Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-800">
                Requirements incomplete
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || (!canMove && !['Won', 'Lost', 'Dropped'].includes(targetStage))}
            >
              {isSubmitting ? 'Moving...' : `Move to ${targetStage}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StageRequirementsDialog;
