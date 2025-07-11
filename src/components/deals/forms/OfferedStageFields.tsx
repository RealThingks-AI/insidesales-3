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

interface OfferedStageFieldsProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const OfferedStageFields = ({ formData, updateFormData }: OfferedStageFieldsProps) => {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-medium text-sm text-gray-700">Offered Stage</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="proposal_sent_date">Proposal Sent Date</Label>
          <Input
            id="proposal_sent_date"
            type="date"
            value={formData.proposal_sent_date}
            onChange={(e) => updateFormData({ proposal_sent_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="decision_expected_date">Decision Expected Date</Label>
          <Input
            id="decision_expected_date"
            type="date"
            value={formData.decision_expected_date}
            onChange={(e) => updateFormData({ decision_expected_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="negotiation_status">Negotiation Status</Label>
        <Select value={formData.negotiation_status} onValueChange={(value) => updateFormData({ negotiation_status: value })}>
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

      <div className="space-y-2">
        <Label htmlFor="negotiation_notes">Negotiation Notes</Label>
        <Textarea
          id="negotiation_notes"
          value={formData.negotiation_notes}
          onChange={(e) => updateFormData({ negotiation_notes: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  );
};