import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'contact' | 'lead' | 'deal' | 'meeting';
  title: string;
  time: Date;
  description?: string;
}

interface RecentActivityCardProps {
  contacts: any[];
  leads: any[];
  deals: any[];
  meetings: any[];
}

export const RecentActivityCard = ({ contacts, leads, deals, meetings }: RecentActivityCardProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const recentActivities: ActivityItem[] = [];

    // Add recent contacts
    contacts.slice(0, 3).forEach(contact => {
      if (contact.created_time) {
        recentActivities.push({
          id: contact.id,
          type: 'contact',
          title: contact.contact_name,
          time: new Date(contact.created_time),
          description: `New contact from ${contact.company_name || 'Unknown company'}`,
        });
      }
    });

    // Add recent leads
    leads.slice(0, 3).forEach(lead => {
      if (lead.created_time) {
        recentActivities.push({
          id: lead.id,
          type: 'lead',
          title: lead.lead_name,
          time: new Date(lead.created_time),
          description: `Lead status: ${lead.lead_status || 'Unknown'}`,
        });
      }
    });

    // Add recent deals
    deals.slice(0, 3).forEach(deal => {
      if (deal.created_at) {
        recentActivities.push({
          id: deal.id,
          type: 'deal',
          title: deal.deal_name,
          time: new Date(deal.created_at),
          description: `Deal stage: ${deal.stage}`,
        });
      }
    });

    // Add recent meetings
    meetings.slice(0, 3).forEach(meeting => {
      if (meeting.created_at) {
        recentActivities.push({
          id: meeting.id,
          type: 'meeting',
          title: meeting.meeting_title,
          time: new Date(meeting.created_at),
          description: `Scheduled for ${new Date(meeting.date).toLocaleDateString()}`,
        });
      }
    });

    // Sort by time and take the most recent 8
    const sortedActivities = recentActivities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 8);

    setActivities(sortedActivities);
  }, [contacts, leads, deals, meetings]);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'contact': return Users;
      case 'lead': return UserCheck;
      case 'deal': return TrendingUp;
      case 'meeting': return Calendar;
      default: return Clock;
    }
  };

  const getColorClass = (type: ActivityItem['type']) => {
    switch (type) {
      case 'contact': return 'text-blue-600';
      case 'lead': return 'text-green-600';
      case 'deal': return 'text-orange-600';
      case 'meeting': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            activities.map((activity) => {
              const IconComponent = getIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full bg-gray-50 ${getColorClass(activity.type)}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.time, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};