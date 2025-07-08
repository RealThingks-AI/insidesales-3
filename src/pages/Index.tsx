
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Settings Management Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive user management and profile settings with Supabase integration
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-blue-600" />
                Admin Settings Portal
              </CardTitle>
              <CardDescription>
                Manage users, roles, and profile settings with real-time Supabase synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Security & Access</h3>
                      <p className="text-sm text-gray-600">
                        Manage user accounts, roles, and permissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">User Profile</h3>
                      <p className="text-sm text-gray-600">
                        Update personal information and profile settings
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Features:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Add/remove users with email invitations</li>
                    <li>• Role-based access control (Admin/User)</li>
                    <li>• Real-time sync with Supabase Auth</li>
                    <li>• Profile picture upload to Supabase Storage</li>
                    <li>• Comprehensive user data management</li>
                    <li>• Responsive design for all screen sizes</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <Link to="/settings">
                  <Button size="lg" className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Open Settings Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Full CRUD operations for user accounts with immediate Supabase sync
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Create users via email</li>
                  <li>• Delete with cleanup</li>
                  <li>• Role assignment</li>
                  <li>• Last login tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive profile management with file uploads
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Display name & username</li>
                  <li>• Phone number</li>
                  <li>• Avatar upload</li>
                  <li>• Real-time validation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  All changes reflect immediately in Supabase backend
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Auth table updates</li>
                  <li>• Users table sync</li>
                  <li>• Roles & permissions</li>
                  <li>• File storage</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
