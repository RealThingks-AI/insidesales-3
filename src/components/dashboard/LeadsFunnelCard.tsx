import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface LeadData {
  status: string;
  count: number;
  color: string;
}

const STATUS_COLORS = {
  'New': '#3b82f6',
  'Qualified': '#10b981',
  'Won': '#22c55e',
  'Lost': '#ef4444',
  'Cold': '#6b7280',
  'Hot': '#f59e0b',
  'Warm': '#f97316',
  'Unknown': '#8b5cf6'
};

export const LeadsFunnelCard = () => {
  const [data, setData] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeadsData();
  }, []);

  const fetchLeadsData = async () => {
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('lead_status');

      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error",
          description: "Failed to load leads data",
          variant: "destructive",
        });
        return;
      }

      // Group leads by status
      const statusMap = new Map<string, number>();
      
      leads?.forEach(lead => {
        const status = lead.lead_status || 'Unknown';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const leadsData = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Unknown
      }));

      setData(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLeads = data.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{data.payload.status}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} leads ({((data.value / totalLeads) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Leads Funnel
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
          <Users className="h-5 w-5 text-primary" />
          Leads Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalLeads}</p>
            <p className="text-sm text-muted-foreground">Total Leads</p>
          </div>

          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No leads found
            </p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {data.map((item) => (
                  <div key={item.status} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium">{item.status}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};