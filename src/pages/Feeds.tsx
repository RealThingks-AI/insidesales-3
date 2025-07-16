import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Calendar, HandCoins, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  userId?: string;
}

const Feeds = () => {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealActivityFeeds();
  }, []);

  const fetchUserDisplayNames = async (userIds: string[]) => {
    if (userIds.length === 0) return {};
    
    try {
      const { data, error } = await supabase.functions.invoke('get-user-display-names', {
        body: { userIds }
      });
      
      if (error) {
        console.error('Error fetching user display names:', error);
        return {};
      }
      
      return data?.userDisplayNames || {};
    } catch (error) {
      console.error('Error calling get-user-display-names function:', error);
      return {};
    }
  };

  const fetchRealActivityFeeds = async () => {
    try {
      const feeds: FeedItem[] = [];
      const userIds = new Set<string>();

      // Fetch recent contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, contact_name, created_time, created_by')
        .order('created_time', { ascending: false })
        .limit(5);

      if (contacts) {
        contacts.forEach(contact => {
          if (contact.created_by) userIds.add(contact.created_by);
          feeds.push({
            id: `contact-${contact.id}`,
            type: 'contact',
            title: 'New Contact Added',
            description: `${contact.contact_name} was added to the system`,
            timestamp: contact.created_time,
            user: 'Loading...',
            userId: contact.created_by
          });
        });
      }

      // Fetch recent leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, lead_name, created_time, created_by')
        .order('created_time', { ascending: false })
        .limit(5);

      if (leads) {
        leads.forEach(lead => {
          if (lead.created_by) userIds.add(lead.created_by);
          feeds.push({
            id: `lead-${lead.id}`,
            type: 'lead',
            title: 'New Lead Generated',
            description: `${lead.lead_name} was added as a lead`,
            timestamp: lead.created_time,
            user: 'Loading...',
            userId: lead.created_by
          });
        });
      }

      // Fetch recent deals
      const { data: deals } = await supabase
        .from('deals')
        .select('id, deal_name, stage, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(5);

      if (deals) {
        deals.forEach(deal => {
          if (deal.created_by) userIds.add(deal.created_by);
          feeds.push({
            id: `deal-${deal.id}`,
            type: 'deal',
            title: 'Deal Updated',
            description: `${deal.deal_name} moved to ${deal.stage} stage`,
            timestamp: deal.created_at,
            user: 'Loading...',
            userId: deal.created_by
          });
        });
      }

      // Fetch recent meetings
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, meeting_title, start_time, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(5);

      if (meetings) {
        meetings.forEach(meeting => {
          if (meeting.created_by) userIds.add(meeting.created_by);
          feeds.push({
            id: `meeting-${meeting.id}`,
            type: 'meeting',
            title: 'Meeting Scheduled',
            description: `${meeting.meeting_title} scheduled for ${new Date(meeting.start_time).toLocaleDateString()}`,
            timestamp: meeting.created_at,
            user: 'Loading...',
            userId: meeting.created_by
          });
        });
      }

      // Sort all feeds by timestamp
      feeds.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Get the top 10 most recent feeds
      const recentFeeds = feeds.slice(0, 10);
      
      // Fetch user display names for all unique user IDs
      const uniqueUserIds = Array.from(userIds);
      const userDisplayNames = await fetchUserDisplayNames(uniqueUserIds);
      
      // Update feeds with actual user display names
      const updatedFeeds = recentFeeds.map(feed => ({
        ...feed,
        user: feed.userId ? (userDisplayNames[feed.userId] || 'Unknown User') : 'System'
      }));
      
      setFeeds(updatedFeeds);
    } catch (error: any) {
      console.error('Error fetching activity feeds:', error);
      toast({
        variant: "destructive",
        title: "Error loading activity feed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'deal':
        return <HandCoins className="h-4 w-4 text-green-600" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'lead':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'contact':
        return 'bg-blue-50 border-blue-200';
      case 'deal':
        return 'bg-green-50 border-green-200';
      case 'meeting':
        return 'bg-purple-50 border-purple-200';
      case 'lead':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-gray-600 mt-2">Stay updated with recent activities and changes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Activities</p>
                <p className="text-xl font-semibold">{feeds.filter(f => {
                  const today = new Date();
                  const feedDate = new Date(f.timestamp);
                  return feedDate.toDateString() === today.toDateString();
                }).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">New Contacts</p>
                <p className="text-xl font-semibold">{feeds.filter(f => f.type === 'contact').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {feeds.map((item) => (
          <Card key={item.id} className={`border-l-4 ${getActivityColor(item.type)}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 rounded-full bg-white border">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <span className="text-sm text-gray-500">{formatTime(item.timestamp)}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-2">by {item.user}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {feeds.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600">
                Activities will appear here as you use the CRM system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Feeds;
