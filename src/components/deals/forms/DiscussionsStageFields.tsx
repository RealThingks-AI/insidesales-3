import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DiscussionsStageFieldsProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const DiscussionsStageFields = ({ formData, updateFormData }: DiscussionsStageFieldsProps) => {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-medium text-sm text-gray-700">Discussions Stage</h3>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="customer_need_identified"
          checked={formData.customer_need_identified}
          onCheckedChange={(checked) => updateFormData({ customer_need_identified: checked as boolean })}
        />
        <Label htmlFor="customer_need_identified">Customer Need Identified</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="need_summary">Need Summary</Label>
        <Textarea
          id="need_summary"
          value={formData.need_summary}
          onChange={(e) => updateFormData({ need_summary: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="decision_maker_present"
          checked={formData.decision_maker_present}
          onCheckedChange={(checked) => updateFormData({ decision_maker_present: checked as boolean })}
        />
        <Label htmlFor="decision_maker_present">Decision Maker Present</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer_agreed_on_need">Customer Agreed on Need</Label>
        <Select value={formData.customer_agreed_on_need} onValueChange={(value) => updateFormData({ customer_agreed_on_need: value })}>
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
};