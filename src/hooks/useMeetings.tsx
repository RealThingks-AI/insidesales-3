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
  duration: '15 min' | '30 min' | '1 hour' | '2 hours';
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
    { key: 'date_time', label: 'Date & Time', required: true, visible: true },
    { key: 'duration', label: 'Duration', required: false, visible: true },
    { key: 'location', label: 'Location', required: false, visible: false }, // Hidden by default
    { key: 'organizer', label: 'Organizer', required: false, visible: true },
    { key: 'participants', label: 'Participants', required: false, visible: true },
    { key: 'status', label: 'Status', required: false, visible: true },
    { key: 'log_outcome', label: 'Log Outcome', required: false, visible: true },
    { key: 'timezone', label: 'Timezone', required: false, visible: false },
    { key: 'teams_link', label: 'Teams Link', required: false, visible: false },
  ]);

  const fetchMeetings = async () => {
    try {
      console.log('Fetching meetings from useMeetings hook...');
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (meetingsError) {
        console.error('Error fetching meetings:', meetingsError);
        throw meetingsError;
      }
      
      console.log('Raw meetings data:', meetingsData?.length, 'records');
      
      // Fetch user display names from auth users and profiles
      let usersMap = new Map();
      if (meetingsData && meetingsData.length > 0) {
        // Get unique creator IDs
        const creatorIds = [...new Set(meetingsData.map(meeting => meeting.created_by).filter(Boolean))];
        
        if (creatorIds.length > 0) {
          // First try to get from auth.users via admin API
          try {
            const { data: adminData } = await supabase.functions.invoke('get-user-display-names', {
              body: { userIds: creatorIds }
            });
            
            if (adminData?.userDisplayNames) {
              Object.entries(adminData.userDisplayNames).forEach(([userId, displayName]) => {
                usersMap.set(userId, {
                  display_name: displayName as string,
                  email: '' // Email not returned by this function, will be filled from profiles if needed
                });
              });
            }
          } catch (error) {
            console.log('Auth admin API not available, falling back to profiles table');
          }
          
          // Fallback to profiles table for any missing users
          const missingUserIds = creatorIds.filter(id => !usersMap.has(id));
          if (missingUserIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, "Email ID"')
              .in('id', missingUserIds);

            if (!profilesError && profilesData) {
              profilesData.forEach(profile => {
                const displayName = (profile.full_name && profile.full_name !== profile["Email ID"]) 
                  ? profile.full_name 
                  : profile["Email ID"]?.split('@')[0].split('.').map(part => 
                      part.charAt(0).toUpperCase() + part.slice(1)
                    ).join(' ') || 'Unknown User';
                usersMap.set(profile.id, {
                  display_name: displayName,
                  email: profile["Email ID"]
                });
              });
            }
          }
        }
      }
      
      // Fetch participant names if we have meetings with participants
      let participantsMap = new Map();
      if (meetingsData && meetingsData.length > 0) {
        // Get all unique participant IDs
        const allParticipantIds = [...new Set(
          meetingsData.flatMap(meeting => meeting.participants || []).filter(Boolean)
        )];
        
        if (allParticipantIds.length > 0) {
          // Filter out email addresses and only query with valid UUIDs
          const validUUIDs = allParticipantIds.filter(id => 
            !id.includes('@') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          );
          
          if (validUUIDs.length > 0) {
            // Fetch lead names for valid UUID participants only
            const { data: leadsData, error: leadsError } = await supabase
              .from('leads')
              .select('id, lead_name')
              .in('id', validUUIDs);

          if (leadsError) {
            console.error('Error fetching participant names:', leadsError);
          } else {
            // Create a map for quick lookup
            participantsMap = new Map(
              (leadsData || []).map(lead => [lead.id, lead.lead_name])
            );
          }
        }
      }
      }

      const typedMeetings: Meeting[] = (meetingsData || []).map(meeting => {
        const userInfo = usersMap.get(meeting.created_by);
        
        // Convert participant IDs/emails to names - handle both UUIDs and emails
        const participantNames = (meeting.participants || []).map(participant => {
          // First try to get from leads by ID (UUID)
          const leadName = participantsMap.get(participant);
          if (leadName) {
            return leadName;
          }
          
          // If not found by ID, check if it's an email and try to find by email
          if (participant.includes('@')) {
            // Try to find lead by email
            const leadByEmail = Array.from(participantsMap.entries()).find(([_, name]) => 
              participant.toLowerCase().includes(name.toLowerCase().replace(/\s+/g, '.'))
            );
            if (leadByEmail) {
              return leadByEmail[1];
            }
            // Extract name from email as fallback
            return participant.split('@')[0].split('.').map(part => 
              part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' ');
          }
          
          // Return the participant as-is if we can't convert it
          return participant;
        }).filter(Boolean); // Remove any empty values
        
        return {
          ...meeting,
          participants: participantNames,
          duration: (['15 min', '30 min', '1 hour', '2 hours'].includes(meeting.duration) ? meeting.duration : '1 hour') as '15 min' | '30 min' | '1 hour' | '2 hours',
          location: meeting.location as 'Online' | 'In-Person',
          description: meeting.description || '',
          organizer_name: userInfo?.display_name || 'Unknown User',
          organizer_email: userInfo?.email || '',
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
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // For real-time updates, refresh the entire list to get proper organizer/participant info
          fetchMeetings();
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New meeting added",
              description: `${payload.new.meeting_title} has been scheduled`,
            });
          } else {
            toast({
              title: "Meeting updated", 
              description: `${payload.new.meeting_title} has been updated`,
            });
          }
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