
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'lucide-react';
import MeetingBasicInfo from './MeetingBasicInfo';
import MeetingDetails from './MeetingDetails';
import MeetingParticipants from './MeetingParticipants';

interface RegularMeetingLayoutProps {
  formData: any;
  currentDateTime: { date: string; time: string };
  isEditing: boolean;
  isSubmitting: boolean;
  onInputChange: (field: string, value: any) => void;
  onLinkToDeals: () => void;
  onCancel: () => void;
  isDateTimeInPast: (date: string, time: string) => boolean;
}

const RegularMeetingLayout = ({
  formData,
  currentDateTime,
  isEditing,
  isSubmitting,
  onInputChange,
  onLinkToDeals,
  onCancel,
  isDateTimeInPast
}: RegularMeetingLayoutProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MeetingBasicInfo
          formData={formData}
          onInputChange={onInputChange}
          currentDateTime={currentDateTime}
          isDateTimeInPast={isDateTimeInPast}
        />

        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MeetingDetails
              formData={formData}
              onInputChange={onInputChange}
            />
            
            <MeetingParticipants
              participants={formData.participants}
              onParticipantsChange={(participants) => onInputChange('participants', participants)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="description">Meeting Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onInputChange('description', e.target.value)}
              placeholder="Enter meeting description, agenda, or additional notes..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <div>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={onLinkToDeals}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              Link to Deals Pipeline
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Meeting' : 'Create Meeting')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default RegularMeetingLayout;
