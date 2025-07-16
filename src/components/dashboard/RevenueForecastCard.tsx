import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueForecastCardProps {
  deals: any[];
}

export const RevenueForecastCard = ({ deals }: RevenueForecastCardProps) => {
  const forecastData = useMemo(() => {
    const now = new Date();
    const months = [];
    
    // Generate next 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: date.getMonth(),
        year: date.getFullYear(),
        revenue: 0,
      });
    }

    // Calculate revenue forecast based on deal closing dates and probability
    deals.forEach(deal => {
      if (deal.closing_date && deal.amount && deal.probability) {
        const closingDate = new Date(deal.closing_date);
        const monthIndex = months.findIndex(m => 
          m.value === closingDate.getMonth() && m.year === closingDate.getFullYear()
        );
        
        if (monthIndex !== -1) {
          const expectedRevenue = (deal.amount * (deal.probability / 100));
          months[monthIndex].revenue += expectedRevenue;
        }
      }
    });

    return months;
  }, [deals]);

  const totalForecast = forecastData.reduce((sum, month) => sum + month.revenue, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
          <div className="text-center">
            <p className="text-2xl font-bold">{formatCurrency(totalForecast)}</p>
            <p className="text-sm text-muted-foreground">Expected Revenue (6 months)</p>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};