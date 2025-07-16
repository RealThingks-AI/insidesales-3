import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEAL_STAGES } from '@/hooks/useDeals';

interface BasicDealFieldsProps {
  formData: any;
  updateFormData: (updates: any) => void;
  isFieldVisible?: (fieldKey: string) => boolean;
  isFieldReadOnly?: (fieldKey: string) => boolean;
  currentStage?: string;
}

export const BasicDealFields = ({ formData, updateFormData, isFieldVisible = () => true, isFieldReadOnly = () => false, currentStage }: BasicDealFieldsProps) => {
  return (
    <>
      {isFieldVisible('deal_name') && (
        <div className="space-y-2">
          <Label htmlFor="deal_name">Deal Name *</Label>
          <Input
            id="deal_name"
            value={formData.deal_name}
            onChange={(e) => updateFormData({ deal_name: e.target.value })}
            required
            readOnly={isFieldReadOnly('deal_name')}
          />
        </div>
      )}

      {isFieldVisible('stage') && (
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select 
            value={formData.stage} 
            onValueChange={isFieldReadOnly('stage') ? undefined : (value) => updateFormData({ stage: value })}
            disabled={isFieldReadOnly('stage')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEAL_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {isFieldVisible('amount') && (
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => updateFormData({ amount: e.target.value })}
              readOnly={isFieldReadOnly('amount')}
            />
          </div>
        )}
        {isFieldVisible('currency') && (
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select 
              value={formData.currency} 
              onValueChange={isFieldReadOnly('currency') ? undefined : (value) => updateFormData({ currency: value })}
              disabled={isFieldReadOnly('currency')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isFieldVisible('probability') && (
          <div className="space-y-2">
            <Label htmlFor="probability">Probability (%)</Label>
            <Input
              id="probability"
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => updateFormData({ probability: e.target.value })}
              readOnly={isFieldReadOnly('probability')}
            />
          </div>
        )}
        {isFieldVisible('closing_date') && (
          <div className="space-y-2">
            <Label htmlFor="closing_date">Closing Date</Label>
            <Input
              id="closing_date"
              type="date"
              value={formData.closing_date}
              onChange={(e) => updateFormData({ closing_date: e.target.value })}
              readOnly={isFieldReadOnly('closing_date')}
            />
          </div>
        )}
      </div>

      {isFieldVisible('description') && (
        <div className="space-y-2">
          <Label htmlFor="description">
            {currentStage === 'Discussions' ? 'Meeting Description' : 'Description'}
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={2}
            readOnly={isFieldReadOnly('description')}
          />
        </div>
      )}

      {isFieldVisible('budget_holder') && (
        <div className="space-y-2">
          <Label htmlFor="budget_holder">Budget Holder</Label>
          <Input
            id="budget_holder"
            value={formData.budget_holder}
            onChange={(e) => updateFormData({ budget_holder: e.target.value })}
            readOnly={isFieldReadOnly('budget_holder')}
          />
        </div>
      )}

      {isFieldVisible('decision_makers') && (
        <div className="space-y-2">
          <Label htmlFor="decision_makers">Decision Makers</Label>
          <Input
            id="decision_makers"
            value={formData.decision_makers}
            onChange={(e) => updateFormData({ decision_makers: e.target.value })}
            readOnly={isFieldReadOnly('decision_makers')}
          />
        </div>
      )}

      {isFieldVisible('timeline') && (
        <div className="space-y-2">
          <Label htmlFor="timeline">Timeline</Label>
          <Input
            id="timeline"
            value={formData.timeline}
            onChange={(e) => updateFormData({ timeline: e.target.value })}
            readOnly={isFieldReadOnly('timeline')}
          />
        </div>
      )}

      {isFieldVisible('discussion_notes') && currentStage !== 'Qualified' && currentStage !== 'RFQ' && (
        <div className="space-y-2">
          <Label htmlFor="discussion_notes">Discussion Notes</Label>
          <Textarea
            id="discussion_notes"
            value={formData.discussion_notes}
            onChange={(e) => updateFormData({ discussion_notes: e.target.value })}
            rows={2}
            readOnly={isFieldReadOnly('discussion_notes')}
          />
        </div>
      )}

      {isFieldVisible('internal_notes') && (
        <div className="space-y-2">
          <Label htmlFor="internal_notes">Internal Notes</Label>
          <Textarea
            id="internal_notes"
            value={formData.internal_notes}
            onChange={(e) => updateFormData({ internal_notes: e.target.value })}
            rows={2}
            readOnly={isFieldReadOnly('internal_notes')}
          />
        </div>
      )}
    </>
  );
};