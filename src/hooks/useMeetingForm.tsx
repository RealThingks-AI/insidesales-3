import { useMeetingFormData } from './useMeetingFormData';
import { useMeetingSubmission } from './useMeetingSubmission';
import { useMeetingDealContext } from './useMeetingDealContext';
import { useMeetingDealSubmission } from './useMeetingDealSubmission';

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

export const useMeetingForm = (
  meeting: Meeting | null | undefined,
  dealId?: string,
  initialLeadData?: any
) => {
  const {
    formData,
    handleInputChange,
    getCurrentDateTime,
    isDateTimeInPast
  } = useMeetingFormData(meeting, initialLeadData);

  const { isSubmitting: isSubmittingMeeting, submitMeeting } = useMeetingSubmission();

  const {
    dealInfo,
    linkedLead,
    leadOwner,
    dealDescription,
    editableDealTitle,
    editableLeadOwner,
    setDealDescription,
    setEditableDealTitle,
    setEditableLeadOwner
  } = useMeetingDealContext(dealId, meeting);

  const {
    isSubmitting: isSubmittingDeal,
    submitDealUpdate,
    submitDealMeetingUpdate
  } = useMeetingDealSubmission();

  const isSubmitting = isSubmittingMeeting || isSubmittingDeal;

  const handleSubmit = async (
    e: React.FormEvent,
    isLinkedToDeal: boolean,
    onSuccess: () => void
  ) => {
    e.preventDefault();

    // If we're in deal editing mode, update both meeting and deal
    if (dealId && dealInfo && isLinkedToDeal) {
      await submitDealUpdate(
        dealId,
        editableDealTitle,
        dealDescription,
        linkedLead,
        editableLeadOwner,
        leadOwner,
        onSuccess
      );
      return;
    }

    // Submit regular meeting
    await submitMeeting(formData, meeting, isDateTimeInPast, async () => {
      // If we're in deal context, also update the deal description
      if (dealId && dealInfo && !isLinkedToDeal) {
        await submitDealMeetingUpdate(dealId, dealDescription, onSuccess);
      } else {
        onSuccess();
      }
    });
  };

  return {
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
  };
};
