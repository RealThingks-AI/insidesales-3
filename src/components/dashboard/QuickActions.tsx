import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Add Contact',
      icon: Users,
      onClick: () => navigate('/contacts-module'),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
    },
    {
      label: 'Add Lead',
      icon: UserCheck,
      onClick: () => navigate('/leads'),
      color: 'bg-green-50 hover:bg-green-100 text-green-600',
    },
    {
      label: 'Schedule Meeting',
      icon: Calendar,
      onClick: () => navigate('/meetings'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
    },
    {
      label: 'Create Deal',
      icon: TrendingUp,
      onClick: () => navigate('/deals'),
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className={`h-auto flex-col gap-2 py-4 ${action.color}`}
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};