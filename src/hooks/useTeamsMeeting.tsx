
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateTeamsMeetingParams {
  meeting_title: string;
  date: string;
  start_time: string;
  duration: '15 min' | '30 min' | '1 hour' | '2 hours';
  participants: string[];
  location: 'Online' | 'In-Person';
  timezone: string;
  isEditing?: boolean;
  existingMeetingId?: string;
}

export const useTeamsMeeting = () => {
  const deleteTeamsLink = async (meetingId: string) => {
    if (!meetingId) {
      return { success: true, message: 'No Teams meeting ID to delete' };
    }

    try {
      console.log('Attempting to delete Teams meeting with ID:', meetingId);
      
      const { data, error } = await supabase.functions.invoke('delete-teams-meeting', {
        body: {
          meetingId: meetingId
        }
      });

      console.log('Teams meeting deletion response:', { data, error });

      if (error) {
        console.error('Error deleting Teams meeting:', error);
        toast({
          variant: "destructive",
          title: "Teams Meeting Deletion Warning",
          description: "Could not delete the Teams meeting from calendar. Please delete it manually if needed.",
        });
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { success: true, message: 'Teams meeting deleted successfully' };
      } else {
        console.error('Teams meeting deletion failed:', data);
        toast({
          variant: "destructive", 
          title: "Teams Meeting Deletion Warning",
          description: "Could not delete the Teams meeting from calendar. Please delete it manually if needed.",
        });
        return { success: false, error: 'Teams meeting deletion failed' };
      }
    } catch (error: any) {
      console.error('Error in deleteTeamsLink:', error);
      toast({
        variant: "destructive",
        title: "Teams Meeting Deletion Warning", 
        description: "Could not delete the Teams meeting from calendar. Please delete it manually if needed.",
      });
      return { success: false, error: error.message };
    }
  };

  const createOrUpdateTeamsLink = async (params: CreateTeamsMeetingParams) => {
    const { 
      meeting_title, 
      date, 
      start_time, 
      duration, 
      participants, 
      location, 
      timezone, 
      isEditing = false,
      existingMeetingId 
    } = params;

    if (!meeting_title || !date || !start_time) {
      return { meetingUrl: null, meetingId: null };
    }

    try {
      // If updating and there's an existing meeting ID, delete the old meeting first
      if (isEditing && existingMeetingId) {
        console.log('Deleting existing Teams meeting before creating new one...');
        try {
          await deleteTeamsLink(existingMeetingId);
          console.log('Old Teams meeting deletion completed, proceeding with new meeting creation...');
        } catch (error) {
          console.warn('Error deleting old Teams meeting, but proceeding with new meeting creation:', error);
          // Don't block new meeting creation if deletion fails
        }
      }

      const startDateTime = new Date(`${date}T${start_time}:00`);
      
      const durationMinutes = {
        '15 min': 15,
        '30 min': 30,
        '1 hour': 60,
        '2 hours': 120
      }[duration];
      
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
      const startTimeISO = startDateTime.toISOString();
      const endTimeISO = endDateTime.toISOString();

      console.log('Creating new Teams meeting with data:', {
        subject: meeting_title,
        startTime: startTimeISO,
        endTime: endTimeISO,
        attendees: participants,
        location,
        timeZone: timezone
      });

      // Always create a new meeting using the improved edge function
      const { data, error } = await supabase.functions.invoke('manage-teams-meeting', {
        body: {
          subject: meeting_title,
          startTime: startTimeISO,
          endTime: endTimeISO,
          participants: participants, // Let the edge function handle email conversion
          location,
          timeZone: timezone,
          isUpdate: isEditing,
          existingMeetingId: existingMeetingId
        }
      });

      console.log('Teams meeting response:', { data, error });

      if (error) {
        console.error('Error with Teams meeting:', error);
        toast({
          variant: "destructive",
          title: "Teams Meeting Error",
          description: `Unable to ${isEditing ? 'update' : 'create'} Teams meeting. The regular meeting will still be saved.`,
        });
        return { meetingUrl: null, meetingId: null };
      }

      if (data?.success && data?.meetingUrl && data?.meetingId) {
        toast({
          title: `Teams meeting ${isEditing ? 'updated' : 'created'}`,
          description: `Microsoft Teams meeting ${isEditing ? 'has been updated' : 'link has been generated'}!`,
        });
        return { meetingUrl: data.meetingUrl, meetingId: data.meetingId };
      } else {
        console.error('Teams meeting failed:', data);
        toast({
          variant: "destructive",
          title: "Teams Meeting Error",
          description: `Unable to ${isEditing ? 'update' : 'create'} Teams meeting. The regular meeting will still be saved.`,
        });
        return { meetingUrl: null, meetingId: null };
      }
    } catch (error: any) {
      console.error('Error in createOrUpdateTeamsLink:', error);
      toast({
        variant: "destructive",
        title: "Teams Meeting Error",
        description: "An unexpected error occurred. The regular meeting will still be saved.",
      });
      return { meetingUrl: null, meetingId: null };
    }
  };

  return { createOrUpdateTeamsLink, deleteTeamsLink };
};
