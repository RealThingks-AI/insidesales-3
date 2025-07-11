
import { Card, CardContent } from '@/components/ui/card';
import { Building, Users, TrendingUp } from 'lucide-react';

interface Contact {
  id: string;
  contact_name: string;
  company_name: string;
  lead_status: string;
  created_time: string;
}

interface ContactsStatsProps {
  contacts: Contact[];
}

const ContactsStats = ({ contacts }: ContactsStatsProps) => {
  const getStatusStats = () => {
    const statuses = ['New', 'Contacted', 'Qualified', 'Lost'];
    return statuses.map(status => ({
      status,
      count: contacts.filter(c => c.lead_status?.toLowerCase() === status.toLowerCase()).length,
      label: status,
    }));
  };

  const statusStats = getStatusStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-xl font-semibold">{contacts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {statusStats.map((stat) => (
        <Card key={stat.status}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                stat.status === 'New' ? 'bg-blue-100' :
                stat.status === 'Contacted' ? 'bg-yellow-100' :
                stat.status === 'Qualified' ? 'bg-green-100' :
                'bg-red-100'
              }`}>
                <TrendingUp className={`h-4 w-4 ${
                  stat.status === 'New' ? 'text-blue-600' :
                  stat.status === 'Contacted' ? 'text-yellow-600' :
                  stat.status === 'Qualified' ? 'text-green-600' :
                  'text-red-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-xl font-semibold">{stat.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ContactsStats;
