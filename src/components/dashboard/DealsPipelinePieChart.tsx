import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PipelineData {
  stage: string;
  count: number;
  value: number;
  color: string;
}

const STAGE_COLORS = {
  'Discussions': '#3b82f6',
  'Qualified': '#10b981', 
  'RFQ': '#f59e0b',
  'Offered': '#8b5cf6',
  'Final': '#ef4444',
  'Won': '#22c55e',
  'Lost': '#6b7280',
  'Dropped': '#dc2626'
};

export const DealsPipelinePieChart = () => {
  const [data, setData] = useState<PipelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('stage, amount')
        .not('stage', 'is', null);

      if (error) {
        console.error('Error fetching pipeline data:', error);
        toast({
          title: "Error",
          description: "Failed to load pipeline data",
          variant: "destructive",
        });
        return;
      }

      // Group deals by stage
      const pipelineMap = new Map<string, { count: number; value: number }>();
      
      deals?.forEach(deal => {
        const stage = deal.stage || 'Unknown';
        const current = pipelineMap.get(stage) || { count: 0, value: 0 };
        pipelineMap.set(stage, {
          count: current.count + 1,
          value: current.value + (deal.amount || 0)
        });
      });

      const pipelineData = Array.from(pipelineMap.entries()).map(([stage, stats]) => ({
        stage,
        count: stats.count,
        value: stats.value,
        color: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || '#8b5cf6'
      }));

      setData(pipelineData);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalDeals = data.reduce((sum, item) => sum + item.count, 0);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{data.payload.stage}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} deals ({((data.value / totalDeals) * 100).toFixed(1)}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Value: {formatCurrency(data.payload.value)}
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
            <TrendingUp className="h-5 w-5 text-primary" />
            Deals Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Deals Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalDeals}</p>
              <p className="text-sm text-muted-foreground">Total Deals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
          </div>
          
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No deals found
            </p>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={100}
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
                  <div key={item.stage} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium">{item.stage}</span>
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