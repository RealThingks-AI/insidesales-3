
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  type: 'contact' | 'lead' | 'meeting';
  title: string;
  description: string;
  timestamp: string;
}

const RecentActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const [contactsResult, leadsResult, meetingsResult] = await Promise.all([
          supabase
            .from('contacts')
            .select('id, contact_name, created_time')
            .order('created_time', { ascending: false })
            .limit(3),
          supabase
            .from('leads')
            .select('id, lead_name, created_time')
            .order('created_time', { ascending: false })
            .limit(3),
          supabase
            .from('meetings')
            .select('id, meeting_title, created_at')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        const allActivities: Activity[] = [];

        // Add contacts
        if (contactsResult.data) {
          contactsResult.data.forEach(contact => {
            allActivities.push({
              id: contact.id,
              type: 'contact',
              title: contact.contact_name || 'Unknown Contact',
              description: 'New contact added',
              timestamp: contact.created_time,
            });
          });
        }

        // Add leads
        if (leadsResult.data) {
          leadsResult.data.forEach(lead => {
            allActivities.push({
              id: lead.id,
              type: 'lead',
              title: lead.lead_name || 'Unknown Lead',
              description: 'New lead created',
              timestamp: lead.created_time || new Date().toISOString(),
            });
          });
        }

        // Add meetings
        if (meetingsResult.data) {
          meetingsResult.data.forEach(meeting => {
            allActivities.push({
              id: meeting.id,
              type: 'meeting',
              title: meeting.meeting_title,
              description: 'Meeting scheduled',
              timestamp: meeting.created_at,
            });
          });
        }

        // Sort by timestamp and take top 10
        allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(allActivities.slice(0, 10));
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'lead':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activities</p>
          ) : (
            activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.description} • {formatTimestamp(activity.timestamp)}
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

export default RecentActivities;
