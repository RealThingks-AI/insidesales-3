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
  stage: string;
}

export const FinalStageFields = ({ formData, updateFormData, readOnly = false, stage }: FinalStageFieldsProps) => {
  // Loss and Drop reason fields should always be editable
  const isEditable = stage === 'Lost' || stage === 'Dropped' ? true : !readOnly;
  
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-medium text-sm text-gray-700">
        Final Stage Fields
      </h3>
      
      {stage === 'Won' && (
        <div className="space-y-2">
          <Label htmlFor="win_reason">Win Reason</Label>
          <Textarea
            id="win_reason"
            value={formData.win_reason}
            onChange={isEditable ? (e) => updateFormData({ win_reason: e.target.value }) : undefined}
            rows={2}
            readOnly={!isEditable}
          />
        </div>
      )}

      {stage === 'Lost' && (
        <div className="space-y-2">
          <Label htmlFor="loss_reason">Loss Reason</Label>
          <Select 
            value={formData.loss_reason} 
            onValueChange={isEditable ? (value) => updateFormData({ loss_reason: value }) : undefined}
            disabled={!isEditable}
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
      )}

      {stage === 'Dropped' && (
        <div className="space-y-2">
          <Label htmlFor="drop_reason">Drop Reason</Label>
          <Textarea
            id="drop_reason"
            value={formData.drop_reason}
            onChange={isEditable ? (e) => updateFormData({ drop_reason: e.target.value }) : undefined}
            rows={2}
            readOnly={!isEditable}
          />
        </div>
      )}
    </div>
  );
};