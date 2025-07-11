import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAJOR_TIMEZONES } from '@/utils/timezones';

interface TimezoneSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const TimezoneSelector = ({ value, onValueChange }: TimezoneSelectorProps) => {
  return (
    <div>
      <Label htmlFor="timezone">Timezone</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent className="bg-background border max-h-60 overflow-y-auto">
          {MAJOR_TIMEZONES.map((timezone) => (
            <SelectItem key={timezone.value} value={timezone.value}>
              {timezone.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimezoneSelector;