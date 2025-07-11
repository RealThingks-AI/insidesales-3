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
}

export const BasicDealFields = ({ formData, updateFormData }: BasicDealFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="deal_name">Deal Name *</Label>
        <Input
          id="deal_name"
          value={formData.deal_name}
          onChange={(e) => updateFormData({ deal_name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage">Stage</Label>
        <Select value={formData.stage} onValueChange={(value) => updateFormData({ stage: value })}>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => updateFormData({ amount: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => updateFormData({ currency: value })}>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="probability">Probability (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) => updateFormData({ probability: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closing_date">Closing Date</Label>
          <Input
            id="closing_date"
            type="date"
            value={formData.closing_date}
            onChange={(e) => updateFormData({ closing_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget_holder">Budget Holder</Label>
        <Input
          id="budget_holder"
          value={formData.budget_holder}
          onChange={(e) => updateFormData({ budget_holder: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="decision_makers">Decision Makers</Label>
        <Input
          id="decision_makers"
          value={formData.decision_makers}
          onChange={(e) => updateFormData({ decision_makers: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline">Timeline</Label>
        <Input
          id="timeline"
          value={formData.timeline}
          onChange={(e) => updateFormData({ timeline: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="discussion_notes">Discussion Notes</Label>
        <Textarea
          id="discussion_notes"
          value={formData.discussion_notes}
          onChange={(e) => updateFormData({ discussion_notes: e.target.value })}
          rows={2}
        />
      </div>
    </>
  );
};