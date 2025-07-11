
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MeetingColumn {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  duration: '30 min' | '1 hour';
  location: 'Online' | 'In-Person';
  timezone: string;
  participants: string[];
  teams_link?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  organizer_name?: string;
  organizer_email?: string;
}

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const [columns, setColumns] = useState<MeetingColumn[]>([
    { key: 'meeting_title', label: 'Meeting Title', required: true, visible: true },
    { key: 'date', label: 'Date', required: true, visible: true },
    { key: 'start_time', label: 'Start Time', required: true, visible: true },
    { key: 'duration', label: 'Duration', required: false, visible: true },
    { key: 'location', label: 'Location', required: true, visible: true },
    { key: 'timezone', label: 'Timezone', required: false, visible: false },
    { key: 'participants', label: 'Participants', required: false, visible: false },
    { key: 'teams_link', label: 'Teams Link', required: false, visible: false },
  ]);

  const fetchMeetings = async () => {
    try {
      console.log('Fetching meetings from useMeetings hook...');
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

      if (meetingsError) {
        console.error('Error fetching meetings:', meetingsError);
        throw meetingsError;
      }
      
      console.log('Raw meetings data:', meetingsData);
      
      // Get unique creator IDs
      const creatorIds = [...new Set(meetingsData?.map(meeting => meeting.created_by).filter(Boolean) || [])];
      
      // Fetch profile data for all creators
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, "Email ID"')
        .in('id', creatorIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );
      
      const typedMeetings: Meeting[] = (meetingsData || []).map(meeting => {
        console.log('Processing meeting:', meeting.id, meeting.meeting_title);
        const profile = profilesMap.get(meeting.created_by);
        return {
          ...meeting,
          participants: meeting.participants || [],
          duration: (['30 min', '1 hour'].includes(meeting.duration) ? meeting.duration : '1 hour') as '30 min' | '1 hour',
          location: meeting.location as 'Online' | 'In-Person',
          description: meeting.description || '',
          organizer_name: profile?.full_name || 'Unknown Organizer',
          organizer_email: profile?.["Email ID"] || '',
        };
      });
      
      console.log('Processed meetings:', typedMeetings.length, 'records');
      setMeetings(typedMeetings);
    } catch (error: any) {
      console.error('Error fetching meetings in useMeetings:', error);
      toast({
        variant: "destructive",
        title: "Error fetching meetings",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();

    // Set up real-time subscription for meetings
    const meetingsSubscription = supabase
      .channel('meetings-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meetings'
      }, (payload) => {
        console.log('Real-time meeting change:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newMeeting = {
            ...payload.new,
            participants: payload.new.participants || [],
            duration: (['30 min', '1 hour'].includes(payload.new.duration) ? payload.new.duration : '1 hour') as '30 min' | '1 hour',
            location: payload.new.location as 'Online' | 'In-Person',
            description: payload.new.description || '',
          } as Meeting;
          
          console.log('Adding new meeting via realtime:', newMeeting.id);
          setMeetings(prev => [newMeeting, ...prev]);
          toast({
            title: "New meeting added",
            description: `${newMeeting.meeting_title} has been scheduled`,
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedMeeting = {
            ...payload.new,
            participants: payload.new.participants || [],
            duration: (['30 min', '1 hour'].includes(payload.new.duration) ? payload.new.duration : '1 hour') as '30 min' | '1 hour',
            location: payload.new.location as 'Online' | 'In-Person',
            description: payload.new.description || '',
          } as Meeting;
          
          console.log('Updating meeting via realtime:', updatedMeeting.id);
          setMeetings(prev => prev.map(meeting => 
            meeting.id === updatedMeeting.id ? updatedMeeting : meeting
          ));
          toast({
            title: "Meeting updated",
            description: `${updatedMeeting.meeting_title} has been updated`,
          });
        } else if (payload.eventType === 'DELETE') {
          console.log('Deleting meeting via realtime:', payload.old.id);
          setMeetings(prev => prev.filter(meeting => meeting.id !== payload.old.id));
          toast({
            title: "Meeting deleted",
            description: "A meeting has been removed",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(meetingsSubscription);
    };
  }, []);

  return {
    meetings,
    loading,
    columns,
    setColumns,
    fetchMeetings,
  };
};
