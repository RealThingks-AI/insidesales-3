
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MeetingBasicInfoProps {
  formData: {
    meeting_title: string;
    date: string;
    start_time: string;
    duration: '30 min' | '1 hour';
    location: 'Online' | 'In-Person';
  };
  onInputChange: (field: string, value: any) => void;
  currentDateTime: {
    date: string;
    time: string;
  };
  isDateTimeInPast: (date: string, time: string) => boolean;
}

const MeetingBasicInfo = ({ formData, onInputChange, currentDateTime, isDateTimeInPast }: MeetingBasicInfoProps) => {
  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  // Get the next available 30-minute slot from current time
  const getNextAvailable30MinSlot = () => {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const nextSlotMinutes = currentMinutes <= 30 ? 30 : 60;
    
    if (nextSlotMinutes === 60) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    } else {
      now.setMinutes(30);
    }
    
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const timeOptions = generateTimeOptions();
  const suggestedTime = getNextAvailable30MinSlot();

  // Set default time if not already set
  if (!formData.start_time) {
    onInputChange('start_time', suggestedTime);
  }

  // Set default date to today if not already set
  if (!formData.date) {
    onInputChange('date', currentDateTime.date);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="meeting_title">Meeting Title *</Label>
          <Input
            id="meeting_title"
            value={formData.meeting_title}
            onChange={(e) => onInputChange('meeting_title', e.target.value)}
            placeholder="Enter meeting title"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => onInputChange('date', e.target.value)}
              min={currentDateTime.date}
              required
            />
          </div>

          <div>
            <Label htmlFor="start_time">Start Time *</Label>
            <Select value={formData.start_time} onValueChange={(value) => onInputChange('start_time', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem 
                    key={time} 
                    value={time}
                    className={time === suggestedTime ? 'bg-blue-50 font-medium' : ''}
                  >
                    {time} {time === suggestedTime ? '(Suggested)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Select value={formData.duration} onValueChange={(value) => onInputChange('duration', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 min">30 minutes</SelectItem>
                <SelectItem value="1 hour">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Select value={formData.location} onValueChange={(value) => onInputChange('location', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="In-Person">In-Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isDateTimeInPast(formData.date, formData.start_time) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Warning: The selected date and time is in the past.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingBasicInfo;
