import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DealDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const DealDescriptionField = ({ value, onChange }: DealDescriptionFieldProps) => {
  return (
    <div>
      <Label htmlFor="deal-description">Deal Description</Label>
      <Textarea
        id="deal-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter initial deal description or meeting notes..."
        rows={4}
      />
    </div>
  );
};