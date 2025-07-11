
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DealInformationCardProps {
  dealInfo: any;
  linkedLead: any;
  leadOwner: any;
  editableDealTitle: string;
  editableLeadOwner: string;
  dealDescription: string;
  onTitleChange: (value: string) => void;
  onLeadOwnerChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const DealInformationCard = ({
  dealInfo,
  linkedLead,
  leadOwner,
  editableDealTitle,
  editableLeadOwner,
  dealDescription,
  onTitleChange,
  onLeadOwnerChange,
  onDescriptionChange
}: DealInformationCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="deal_title">Deal Title</Label>
          <Input
            id="deal_title"
            value={editableDealTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter deal title"
          />
        </div>

        {linkedLead && (
          <div>
            <Label htmlFor="lead_name">Lead Name</Label>
            <Input
              id="lead_name"
              value={linkedLead.lead_name || ''}
              readOnly
              className="bg-gray-50"
            />
          </div>
        )}

        {linkedLead?.company_name && (
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={linkedLead.company_name}
              readOnly
              className="bg-gray-50"
            />
          </div>
        )}

        {leadOwner && (
          <div>
            <Label htmlFor="lead_owner">Lead Owner</Label>
            <Input
              id="lead_owner"
              value={leadOwner.full_name || ''}
              readOnly
              className="bg-gray-50"
            />
          </div>
        )}

        <div>
          <Label htmlFor="deal_description">Deal Description</Label>
          <Textarea
            id="deal_description"
            value={dealDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Enter deal description..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DealInformationCard;
