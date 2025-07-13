import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  location?: string;
  participants?: string[];
}

export const MeetingsSummaryCard = () => {
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetingsData();
  }, []);

  const fetchMeetingsData = async () => {
    try {
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching meetings:', error);
        toast({
          title: "Error",
          description: "Failed to load meetings data",
          variant: "destructive",
        });
        return;
      }

      const now = new Date();
      const upcoming: Meeting[] = [];
      const past: Meeting[] = [];

      meetings?.forEach(meeting => {
        const meetingDateTime = parseISO(`${meeting.date}T${meeting.start_time}`);
        
        if (isAfter(meetingDateTime, now)) {
          upcoming.push(meeting);
        } else {
          past.push(meeting);
        }
      });

      setUpcomingMeetings(upcoming.slice(0, 3)); // Show only next 3
      setPastMeetings(past.slice(-2)); // Show last 2
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMeetingTime = (date: string, time: string) => {
    try {
      const meetingDate = parseISO(date);
      return format(meetingDate, 'MMM d');
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Meetings Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Meetings Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upcoming Meetings */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Upcoming ({upcomingMeetings.length})
            </h4>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming meetings</p>
            ) : (
              <div className="space-y-2">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium truncate">{meeting.meeting_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.location || 'Online'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {formatMeetingTime(meeting.date, meeting.start_time)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.start_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Meetings */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Recent ({pastMeetings.length})
            </h4>
            {pastMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent meetings</p>
            ) : (
              <div className="space-y-2">
                {pastMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium truncate">{meeting.meeting_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.participants?.length || 0} participants
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {formatMeetingTime(meeting.date, meeting.start_time)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};