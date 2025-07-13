import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

export const PipelineOverviewCard = () => {
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
        value: stats.value
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Pipeline Overview
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
          <TrendingUp className="h-5 w-5 text-primary" />
          Pipeline Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{totalDeals}</p>
              <p className="text-sm text-muted-foreground">Total Deals</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No deals found
              </p>
            ) : (
              data.map((item) => (
                <div key={item.stage} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.stage}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium">{item.count} deals</span>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};