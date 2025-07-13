import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DealTitleFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const DealTitleField = ({ value, onChange }: DealTitleFieldProps) => {
  return (
    <div>
      <Label htmlFor="deal-title">Deal Title</Label>
      <Input
        id="deal-title"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter deal title"
      />
    </div>
  );
};