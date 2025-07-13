
import React from 'react';
import UserManagementSection from '@/components/settings/UserManagementSection';

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full p-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          <UserManagementSection />
        </div>
      </div>
    </div>
  );
};

export default Settings;
