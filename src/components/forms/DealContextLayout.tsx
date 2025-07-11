
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MeetingBasicInfo from './MeetingBasicInfo';
import MeetingDetails from './MeetingDetails';
import MeetingParticipants from './MeetingParticipants';

interface Deal {
  id: string;
  deal_name: string;
  description?: string;
  related_lead_id?: string;
}

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  contact_owner?: string;
}

interface DealContextLayoutProps {
  dealInfo: Deal;
  linkedLead: Lead | null;
  formData: any;
  dealDescription: string;
  currentDateTime: { date: string; time: string };
  onInputChange: (field: string, value: any) => void;
  onDescriptionChange: (value: string) => void;
  isDateTimeInPast: (date: string, time: string) => boolean;
}

const DealContextLayout = ({
  dealInfo,
  linkedLead,
  formData,
  dealDescription,
  currentDateTime,
  onInputChange,
  onDescriptionChange,
  isDateTimeInPast
}: DealContextLayoutProps) => {
  return (
    <>
      {/* Deal Title */}
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{dealInfo.deal_name}</h2>
      </div>

      {/* Company Name and Lead Info */}
      <div className="space-y-4">
        {linkedLead && (
          <>
            {linkedLead.company_name && (
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">{linkedLead.company_name}</p>
              </div>
            )}
            {linkedLead.lead_name && (
              <div className="text-center">
                <p className="text-md text-gray-600">Lead: {linkedLead.lead_name}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Meeting Form */}
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

      {/* Deal Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="deal_description">Deal Description</Label>
            <Textarea
              id="deal_description"
              value={dealDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter deal notes, requirements, or additional details..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default DealContextLayout;
