
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    leads: 0,
    deals: 0,
    meetings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [leadsResult, dealsResult, meetingsResult] = await Promise.all([
          supabase.from('leads').select('*'),
          supabase.from('deals').select('*'),
          supabase.from('meetings').select('*'),
        ]);

        setStats({
          leads: leadsResult.data?.length || 0,
          deals: dealsResult.data?.length || 0,
          meetings: meetingsResult.data?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const widgets = [
    {
      title: 'Total Leads',
      count: stats.leads,
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      route: '/leads'
    },
    {
      title: 'Total Meetings',
      count: stats.meetings,
      icon: Calendar,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      route: '/meetings'
    },
    {
      title: 'Total Deals',
      count: stats.deals,
      icon: TrendingUp,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      route: '/deals'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your CRM dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <Card 
            key={widget.title}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => navigate(widget.route)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{widget.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{widget.count}</p>
                </div>
                <div className={`p-3 ${widget.bgColor} rounded-full`}>
                  <widget.icon className={`h-6 w-6 ${widget.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
