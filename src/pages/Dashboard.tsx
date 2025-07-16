
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import { DashboardCustomizationModal } from '@/components/dashboard/DashboardCustomizationModal';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { DealsPipelinePieChart } from '@/components/dashboard/DealsPipelinePieChart';
import ContactsChart from '@/components/dashboard/ContactsChart';
import LeadsChart from '@/components/dashboard/LeadsChart';
import MeetingsChart from '@/components/dashboard/MeetingsChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { contacts, leads, deals, meetings, loading, error } = useDashboardData();
  const { preferences, loading: preferencesLoading } = useDashboardPreferences();

  if (loading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getLayoutClasses = () => {
    switch (preferences.layout_view) {
      case 'compact':
        return 'gap-4';
      case 'analytics':
        return 'gap-6';
      case 'minimal':
        return 'gap-4';
      default:
        return 'gap-6';
    }
  };

  const getWidgetSize = () => {
    switch (preferences.layout_view) {
      case 'compact':
        return 'lg:col-span-1';
      case 'analytics':
        return 'lg:col-span-2';
      case 'minimal':
        return 'lg:col-span-1';
      default:
        return 'lg:col-span-1';
    }
  };

  const renderWidget = (widgetId: string) => {
    if (!preferences.visible_widgets.includes(widgetId)) return null;

    switch (widgetId) {
      case 'pipeline':
        return <DealsPipelinePieChart key={widgetId} />;
      case 'meetings':
        return (
          <div key={widgetId} className={preferences.layout_view === 'analytics' ? 'lg:col-span-2' : ''}>
            <MeetingsChart meetings={meetings} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <DashboardCustomizationModal />
      </div>

      {/* Summary Stats */}
      {(preferences.layout_view === 'grid' || preferences.layout_view === 'compact') && (
        <DashboardStats
          contactsCount={contacts.length}
          leadsCount={leads.length}
          dealsCount={deals.length}
          meetingsCount={meetings.length}
        />
      )}

      {/* Main Dashboard Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 ${getLayoutClasses()}`}>
        {/* Quick Actions - Always visible in compact/grid layout */}
        {(preferences.layout_view === 'grid' || preferences.layout_view === 'compact') && (
          <QuickActions />
        )}

        {/* Render widgets based on user preferences and order */}
        {preferences.card_order.map(renderWidget)}

        {/* Additional charts for analytics view */}
        {preferences.layout_view === 'analytics' && (
          <>
            <div className="lg:col-span-2">
              <ContactsChart contacts={contacts} />
            </div>
            <div className="lg:col-span-2">
              <LeadsChart leads={leads} />
            </div>
          </>
        )}
      </div>

      {/* Minimal layout special handling */}
      {preferences.layout_view === 'minimal' && (
        <div className="mt-6">
          <QuickActions />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
