
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
  existingTeamsLink?: string;
}

export const useTeamsMeeting = () => {
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
      existingTeamsLink 
    } = params;

    if (!meeting_title || !date || !start_time) {
      return null;
    }

    try {
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

      console.log(`${isEditing ? 'Updating' : 'Creating'} Teams meeting with data:`, {
        subject: meeting_title,
        startTime: startTimeISO,
        endTime: endTimeISO,
        attendees: participants,
        location,
        timeZone: timezone,
        isUpdate: isEditing && !!existingTeamsLink
      });

      const { data, error } = await supabase.functions.invoke('create-teams-meeting', {
        body: {
          subject: meeting_title,
          startTime: startTimeISO,
          endTime: endTimeISO,
          attendees: participants,
          location,
          timeZone: timezone,
          isUpdate: isEditing && !!existingTeamsLink,
          existingTeamsLink: existingTeamsLink
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
        return null;
      }

      if (data?.success && data?.meetingUrl) {
        toast({
          title: `Teams meeting ${isEditing ? 'updated' : 'created'}`,
          description: `Microsoft Teams meeting ${isEditing ? 'has been updated' : 'link has been generated'}!`,
        });
        return data.meetingUrl;
      } else {
        console.error('Teams meeting failed:', data);
        toast({
          variant: "destructive",
          title: "Teams Meeting Error",
          description: `Unable to ${isEditing ? 'update' : 'create'} Teams meeting. The regular meeting will still be saved.`,
        });
        return null;
      }
    } catch (error: any) {
      console.error('Error in createOrUpdateTeamsLink:', error);
      toast({
        variant: "destructive",
        title: "Teams Meeting Error",
        description: "An unexpected error occurred. The regular meeting will still be saved.",
      });
      return null;
    }
  };

  return { createOrUpdateTeamsLink };
};
