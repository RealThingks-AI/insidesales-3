import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

interface RevenueData {
  month: string;
  expected: number;
  deals: number;
}

export const RevenueForecastCard = () => {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('closing_date, amount, probability')
        .not('closing_date', 'is', null)
        .not('amount', 'is', null);

      if (error) {
        console.error('Error fetching revenue data:', error);
        toast({
          title: "Error",
          description: "Failed to load revenue forecast",
          variant: "destructive",
        });
        return;
      }

      // Group deals by month
      const monthlyData = new Map<string, { expected: number; deals: number }>();

      deals?.forEach(deal => {
        if (!deal.closing_date || !deal.amount) return;

        try {
          const closingDate = parseISO(deal.closing_date);
          const monthKey = format(startOfMonth(closingDate), 'yyyy-MM');
          const monthLabel = format(closingDate, 'MMM yyyy');
          
          const probability = (deal.probability || 50) / 100; // Default to 50% if not set
          const expectedAmount = deal.amount * probability;

          const current = monthlyData.get(monthLabel) || { expected: 0, deals: 0 };
          monthlyData.set(monthLabel, {
            expected: current.expected + expectedAmount,
            deals: current.deals + 1
          });
        } catch (error) {
          console.error('Error parsing date:', deal.closing_date);
        }
      });

      // Convert to array and sort by date
      const revenueData = Array.from(monthlyData.entries())
        .map(([month, stats]) => ({
          month,
          expected: Math.round(stats.expected),
          deals: stats.deals
        }))
        .sort((a, b) => {
          try {
            const dateA = parseISO(`${a.month.split(' ')[1]}-${a.month.split(' ')[0]}-01`);
            const dateB = parseISO(`${b.month.split(' ')[1]}-${b.month.split(' ')[0]}-01`);
            return dateA.getTime() - dateB.getTime();
          } catch {
            return 0;
          }
        })
        .slice(0, 6); // Show next 6 months

      setData(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
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

  const totalExpected = data.reduce((sum, item) => sum + item.expected, 0);
  const totalDeals = data.reduce((sum, item) => sum + item.deals, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            Expected: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.payload.deals} deals
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
            <DollarSign className="h-5 w-5 text-primary" />
            Revenue Forecast
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
          <DollarSign className="h-5 w-5 text-primary" />
          Revenue Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalExpected)}</p>
              <p className="text-sm text-muted-foreground">Expected Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDeals}</p>
              <p className="text-sm text-muted-foreground">Forecasted Deals</p>
            </div>
          </div>

          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No revenue forecast data
            </p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="expected" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};