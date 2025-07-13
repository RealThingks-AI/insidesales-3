
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface LeadInformationSectionProps {
  defaultLead: any;
  leadOwner: any;
  meetingData: any;
}

export const LeadInformationSection = ({ defaultLead, leadOwner, meetingData }: LeadInformationSectionProps) => {
  if (defaultLead) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-green-900">
            Related Lead Found
          </h3>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Match Found
          </Badge>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Lead Name</Label>
            <Input
              value={defaultLead.lead_name || ''}
              readOnly
              className="bg-white border-green-200"
            />
          </div>
          
          {defaultLead.company_name && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Company Name</Label>
              <Input
                value={defaultLead.company_name}
                readOnly
                className="bg-white border-green-200"
              />
            </div>
          )}

          {defaultLead.email && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                value={defaultLead.email}
                readOnly
                className="bg-white border-green-200"
              />
            </div>
          )}

          {defaultLead.lead_status && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <Input
                value={defaultLead.lead_status}
                readOnly
                className="bg-white border-green-200"
              />
            </div>
          )}

          {defaultLead.position && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Position</Label>
              <Input
                value={defaultLead.position}
                readOnly
                className="bg-white border-green-200"
              />
            </div>
          )}
          
          {leadOwner && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Lead Owner</Label>
              <Input
                value={leadOwner.full_name}
                readOnly
                className="bg-white border-green-200"
              />
            </div>
          )}
        </div>
        <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-700">
          <strong>✓ Lead Match:</strong> Found matching lead for meeting participant. The deal will be linked to this lead.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-blue-900">
          No Related Lead Found
        </h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          No Match
        </Badge>
      </div>
      <p className="text-sm text-blue-700 mb-3">
        No existing leads were found matching the meeting participants' email addresses. The deal will be created using the meeting information only.
      </p>
      <div className="p-2 bg-blue-100 rounded text-sm text-blue-700">
        <strong>Info:</strong> You can create a lead manually later and link it to this deal if needed.
      </div>
    </div>
  );
};
