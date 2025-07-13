import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FinalStageFieldsProps {
  formData: any;
  updateFormData: (updates: any) => void;
  readOnly?: boolean;
}

export const FinalStageFields = ({ formData, updateFormData, readOnly = false }: FinalStageFieldsProps) => {
  return (
    <div className={`space-y-4 border-t pt-4 ${readOnly ? 'opacity-75' : ''}`}>
      <h3 className={`font-medium text-sm ${readOnly ? 'text-gray-500' : 'text-gray-700'}`}>
        Final Stage Fields {readOnly && '(Read Only)'}
      </h3>
      
      <div className="space-y-2">
        <Label htmlFor="win_reason">Win Reason</Label>
        <Textarea
          id="win_reason"
          value={formData.win_reason}
          onChange={readOnly ? undefined : (e) => updateFormData({ win_reason: e.target.value })}
          rows={2}
          readOnly={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="loss_reason">Loss Reason</Label>
        <Select 
          value={formData.loss_reason} 
          onValueChange={readOnly ? undefined : (value) => updateFormData({ loss_reason: value })}
          disabled={readOnly}
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

      <div className="space-y-2">
        <Label htmlFor="drop_reason">Drop Reason</Label>
        <Textarea
          id="drop_reason"
          value={formData.drop_reason}
          onChange={readOnly ? undefined : (e) => updateFormData({ drop_reason: e.target.value })}
          rows={2}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};