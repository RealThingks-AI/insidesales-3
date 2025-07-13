import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Loader2, Users, Calendar, TrendingUp, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'lead' | 'meeting' | 'deal' | 'contact';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

export const RecentActivityCard = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivitiesData();
  }, []);

  const fetchActivitiesData = async () => {
    try {
      // Fetch recent data from different tables
      const [leadsResult, meetingsResult, dealsResult, contactsResult] = await Promise.all([
        supabase.from('leads').select('*').order('created_time', { ascending: false }).limit(5),
        supabase.from('meetings').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('deals').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('contacts').select('*').order('created_time', { ascending: false }).limit(5),
      ]);

      const allActivities: ActivityItem[] = [];

      // Process leads
      leadsResult.data?.forEach(lead => {
        allActivities.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          title: 'New Lead Added',
          description: lead.lead_name,
          timestamp: lead.created_time || new Date().toISOString(),
        });
      });

      // Process meetings
      meetingsResult.data?.forEach(meeting => {
        allActivities.push({
          id: `meeting-${meeting.id}`,
          type: 'meeting',
          title: 'Meeting Scheduled',
          description: meeting.meeting_title,
          timestamp: meeting.created_at || new Date().toISOString(),
        });
      });

      // Process deals
      dealsResult.data?.forEach(deal => {
        allActivities.push({
          id: `deal-${deal.id}`,
          type: 'deal',
          title: 'Deal Created',
          description: deal.deal_name,
          timestamp: deal.created_at || new Date().toISOString(),
        });
      });

      // Process contacts
      contactsResult.data?.forEach(contact => {
        allActivities.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: 'Contact Added',
          description: contact.contact_name,
          timestamp: contact.created_time || new Date().toISOString(),
        });
      });

      // Sort by timestamp and take the most recent 8
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load recent activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'deal':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'contact':
        return <Plus className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
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
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activities
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};