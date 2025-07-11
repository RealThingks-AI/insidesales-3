
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target, Award } from 'lucide-react';
import { Deal } from '@/hooks/useDeals';

interface DealsStatsProps {
  deals: Deal[];
}

const DealsStats = ({ deals }: DealsStatsProps) => {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const wonDeals = deals.filter(deal => deal.stage === 'Won');
  const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const averageDealSize = deals.length > 0 ? totalValue / deals.length : 0;
  const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Pipeline Value</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                ${totalValue.toLocaleString()}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-600 mb-1">Won Deals Value</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                ${wonValue.toLocaleString()}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="p-3 bg-emerald-100 rounded-xl shadow-sm">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-600 mb-1">Average Deal Size</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                ${Math.round(averageDealSize).toLocaleString()}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="p-3 bg-purple-100 rounded-xl shadow-sm">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-600 mb-1">Win Rate</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {winRate.toFixed(1)}%
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="p-3 bg-orange-100 rounded-xl shadow-sm">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DealsStats;
