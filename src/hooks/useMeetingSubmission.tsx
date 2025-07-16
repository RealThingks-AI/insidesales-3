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
  meeting_id?: string;
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

    // Validate that at least one participant is selected
    if (!formData.participants || formData.participants.length === 0) {
      toast({
        variant: "destructive", 
        title: "Participants Required",
        description: "Please select at least one lead as a participant for the meeting.",
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
      let meetingId = meeting?.meeting_id;
      
      if (formData.location === 'Online') {
        // Convert participant UUIDs to emails for Teams meeting
        let participantEmails: string[] = [];
        
        if (formData.participants.length > 0) {
          try {
            // Check if participants are already emails or UUIDs
            const isUUIDs = formData.participants.every(p => 
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p)
            );
            
            if (isUUIDs) {
              // Fetch emails from leads table using UUIDs
              const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('id, email')
                .in('id', formData.participants);
              
              if (leadsError) {
                console.error('Error fetching lead emails for Teams meeting:', leadsError);
              } else {
                participantEmails = (leadsData || [])
                  .map(lead => lead.email)
                  .filter(Boolean); // Remove any null/empty emails
              }
            } else {
              // Participants are already emails
              participantEmails = formData.participants.filter(Boolean);
            }
          } catch (error) {
            console.error('Error converting participants to emails:', error);
          }
        }
        
        const teamsResult = await createOrUpdateTeamsLink({
          meeting_title: formData.meeting_title,
          date: formData.date,
          start_time: formData.start_time,
          duration: formData.duration,
          participants: participantEmails, // Use emails for Teams meeting
          location: formData.location,
          timezone: formData.timezone,
          isEditing,
          existingMeetingId: meeting?.meeting_id
        });
        if (teamsResult?.meetingUrl) {
          teamsLink = teamsResult.meetingUrl;
          meetingId = teamsResult.meetingId;
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
          participants: formData.participants, // Keep UUIDs for database storage
          teams_link: teamsLink,
          meeting_id: meetingId,
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
          participants: formData.participants, // Keep UUIDs for database storage
          teams_link: teamsLink,
          meeting_id: meetingId,
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