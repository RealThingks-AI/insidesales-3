
import TimezoneSelector from './TimezoneSelector';

interface MeetingDetailsProps {
  formData: {
    timezone: string;
  };
  onInputChange: (field: string, value: any) => void;
}

const MeetingDetails = ({ formData, onInputChange }: MeetingDetailsProps) => {
  return (
    <TimezoneSelector
      value={formData.timezone}
      onValueChange={(value) => onInputChange('timezone', value)}
    />
  );
};

export default MeetingDetails;
