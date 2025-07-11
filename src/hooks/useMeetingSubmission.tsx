import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTeamsMeeting } from '@/hooks/useTeamsMeeting';

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

interface FormData {
  meeting_title: string;
  date: string;
  start_time: string;
  duration: '30 min' | '1 hour';
  location: 'Online' | 'In-Person';
  timezone: string;
  participants: string[];
  teams_link: string;
  description: string;
}

export const useMeetingSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createOrUpdateTeamsLink } = useTeamsMeeting();

  const submitMeeting = async (
    formData: FormData,
    meeting: Meeting | null | undefined,
    isDateTimeInPast: (date: string, time: string) => boolean,
    onSuccess: () => void
  ) => {
    if (isDateTimeInPast(formData.date, formData.start_time)) {
      toast({
        variant: "destructive",
        title: "Invalid Date/Time",
        description: "Meeting date and time cannot be in the past.",
      });
      return;
    }

    setIsSubmitting(true);
    
    const isEditing = !!meeting;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to manage meetings.",
        });
        return;
      }

      let teamsLink = formData.teams_link;
      
      if (formData.location === 'Online') {
        const updatedTeamsLink = await createOrUpdateTeamsLink({
          meeting_title: formData.meeting_title,
          date: formData.date,
          start_time: formData.start_time,
          duration: formData.duration,
          participants: formData.participants,
          location: formData.location,
          timezone: formData.timezone,
          isEditing,
          existingTeamsLink: meeting?.teams_link
        });
        if (updatedTeamsLink) {
          teamsLink = updatedTeamsLink;
        }
      }

      console.log(`${isEditing ? 'Updating' : 'Creating'} meeting data:`, formData);

      if (isEditing) {
        const updateData = {
          meeting_title: formData.meeting_title,
          date: formData.date,
          start_time: formData.start_time,
          duration: formData.duration,
          location: formData.location,
          timezone: formData.timezone,
          participants: formData.participants,
          teams_link: teamsLink,
          description: formData.description,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('meetings')
          .update(updateData)
          .eq('id', meeting!.id);

        if (error) {
          console.error('Error updating meeting:', error);
          throw error;
        }
      } else {
        const insertData = {
          meeting_title: formData.meeting_title,
          date: formData.date,
          start_time: formData.start_time,
          duration: formData.duration,
          location: formData.location,
          timezone: formData.timezone,
          participants: formData.participants,
          teams_link: teamsLink,
          description: formData.description,
          created_by: user.id
        };

        const { error } = await supabase
          .from('meetings')
          .insert(insertData);

        if (error) {
          console.error('Error creating meeting:', error);
          throw error;
        }
      }

      toast({
        title: `Meeting ${isEditing ? 'updated' : 'created'} successfully`,
        description: teamsLink && teamsLink !== (meeting?.teams_link || '')
          ? `Meeting has been ${isEditing ? 'updated' : 'created'} and Teams link has been ${isEditing ? 'refreshed' : 'generated'}!` 
          : `Meeting has been ${isEditing ? 'updated' : 'created'} successfully!`,
      });

      onSuccess();
    } catch (error: any) {
      console.error(`Error in handle${isEditing ? 'Update' : 'Create'}:`, error);
      toast({
        variant: "destructive",
        title: `Error ${isEditing ? 'updating' : 'creating'} meeting`,
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitMeeting
  };
};