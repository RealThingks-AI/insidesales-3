
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  UserCheck, 
  Handshake,
  Calendar,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { signOut } = useAuth();
  const { isAdmin, role, isLoading } = useCurrentUserRole();
  const { displayName, loading: profileLoading } = useUserProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/contacts', label: 'Contacts', icon: Users },
    { path: '/leads', label: 'Leads', icon: UserCheck },
    { path: '/meetings', label: 'Meetings', icon: Calendar },
    { path: '/deals', label: 'Deals', icon: Handshake },
    { path: '/feeds', label: 'Feeds', icon: Activity },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSidebar}
          className="p-2"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">CRM Dashboard</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path === '/contacts' && location.pathname === '/contacts-module');
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              {/* Display Name */}
              <div className="text-sm font-medium text-gray-700">
                {!profileLoading && displayName ? displayName : 'User'}
              </div>
              
              {/* Sign Out Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-8 px-3"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
