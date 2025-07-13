
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

      {/* Display Teams Meeting Copy Button for existing meetings */}
      {isEditing && formData.teams_link && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Teams Meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Meeting Join URL</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(formData.teams_link).then(() => {
                    // Using a simple alert for now since we don't have toast access here
                    alert('Teams meeting link copied to clipboard!');
                  }).catch(() => {
                    alert('Failed to copy link to clipboard');
                  });
                }}
              >
                <Link className="w-4 h-4 mr-2" />
                Copy Meeting Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4">
        <div>
          {/* Removed Link to Deals Pipeline button from edit mode */}
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
