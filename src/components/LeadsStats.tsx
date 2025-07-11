
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign } from 'lucide-react';

interface Lead {
  id: string;
  lead_status: string;
  annual_revenue: number;
}

interface LeadsStatsProps {
  leads: Lead[];
}

const LeadsStats = ({ leads }: LeadsStatsProps) => {
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.lead_status === 'Qualified').length;
  const contactedLeads = leads.filter(l => l.lead_status === 'Contacted').length;
  const totalRevenue = leads.reduce((sum, lead) => sum + (lead.annual_revenue || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-xl font-semibold">{totalLeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Qualified</p>
              <p className="text-xl font-semibold">{qualifiedLeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Contacted</p>
              <p className="text-xl font-semibold">{contactedLeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-semibold">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsStats;
