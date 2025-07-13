
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LinkToDealDialog from '@/components/deals/LinkToDealDialog';
import { toast } from '@/hooks/use-toast';
import { Link } from 'lucide-react';
import DealInformationCard from './DealInformationCard';
import DealContextLayout from './DealContextLayout';
import RegularMeetingLayout from './RegularMeetingLayout';
import { useMeetingForm } from '@/hooks/useMeetingForm';

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  duration: '15 min' | '30 min' | '1 hour' | '2 hours';
  location: 'Online' | 'In-Person';
  timezone: string;
  participants: string[];
  teams_link?: string;
  description?: string;
}

interface MeetingFormModalProps {
  meeting?: Meeting | null;
  onSuccess: () => void;
  onCancel: () => void;
  initialLeadData?: any;
  dealId?: string; // New prop to indicate we're editing from deals pipeline
  isLinkedToDeal?: boolean; // New prop to indicate we're in "Link to Deals Pipeline" mode
}

const MeetingFormModal = ({ meeting, onSuccess, onCancel, initialLeadData, dealId, isLinkedToDeal }: MeetingFormModalProps) => {
  const isEditing = !!meeting;
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  
  const {
    formData,
    isSubmitting,
    dealInfo,
    linkedLead,
    leadOwner,
    dealDescription,
    editableDealTitle,
    editableLeadOwner,
    handleInputChange,
    getCurrentDateTime,
    isDateTimeInPast,
    handleSubmit,
    setDealDescription,
    setEditableDealTitle,
    setEditableLeadOwner
  } = useMeetingForm(meeting, dealId, initialLeadData);

  const handleLinkToDeals = () => {
    if (!meeting?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please save the meeting first before linking to deals. Meeting ID is required.",
      });
      return;
    }
    
    console.log('Opening Link to Deals dialog for meeting:', meeting.id, meeting.meeting_title);
    console.log('Current meeting data:', meeting);
    setIsLinkDialogOpen(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, isLinkedToDeal || false, onSuccess);
  };

  const currentDateTime = getCurrentDateTime();

  // Simplified layout for "Link to Deals Pipeline" mode
  if (isLinkedToDeal && dealInfo) {
    return (
      <form onSubmit={onSubmit} className="space-y-6">
        <DealInformationCard
          dealInfo={dealInfo}
          linkedLead={linkedLead}
          leadOwner={leadOwner}
          editableDealTitle={editableDealTitle}
          editableLeadOwner={editableLeadOwner}
          dealDescription={dealDescription}
          onTitleChange={setEditableDealTitle}
          onLeadOwnerChange={setEditableLeadOwner}
          onDescriptionChange={setDealDescription}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Deal'}
          </Button>
        </div>
      </form>
    );
  }

  // Render deal-specific layout when dealId is provided (but not in simplified mode)
  if (dealId && dealInfo) {
    return (
      <form onSubmit={onSubmit} className="space-y-6">
        <DealContextLayout
          dealInfo={dealInfo}
          linkedLead={linkedLead}
          formData={formData}
          dealDescription={dealDescription}
          currentDateTime={currentDateTime}
          onInputChange={handleInputChange}
          onDescriptionChange={setDealDescription}
          isDateTimeInPast={isDateTimeInPast}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Meeting'}
          </Button>
        </div>
      </form>
    );
  }

  // Regular meeting form layout (when not from deals pipeline)
  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <RegularMeetingLayout
          formData={formData}
          currentDateTime={currentDateTime}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onInputChange={handleInputChange}
          onLinkToDeals={handleLinkToDeals}
          onCancel={onCancel}
          isDateTimeInPast={isDateTimeInPast}
        />
      </form>

      <LinkToDealDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        meetingId={meeting?.id || ''}
        meetingTitle={formData.meeting_title || meeting?.meeting_title || 'Untitled Meeting'}
        onSuccess={() => {
          toast({
            title: "Success",
            description: "Deal has been created and linked to this meeting.",
          });
          onSuccess(); // Refresh the parent component
        }}
      />
    </>
  );
};

export default MeetingFormModal;
