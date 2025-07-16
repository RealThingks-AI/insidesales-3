import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DashboardPreferences {
  layout_view: 'grid' | 'compact' | 'analytics' | 'minimal';
  visible_widgets: string[];
  card_order: string[];
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  layout_view: 'grid',
  visible_widgets: ['pipeline', 'meetings'],
  card_order: ['pipeline', 'meetings']
};

export const useDashboardPreferences = () => {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      // Use localStorage instead of database for now
      const stored = localStorage.getItem(`dashboard_preferences_${user.id}`);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences(parsedPreferences);
      }
    } catch (error) {
      console.error('Error loading dashboard preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<DashboardPreferences>) => {
    if (!user) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      // Use localStorage instead of database for now
      localStorage.setItem(
        `dashboard_preferences_${user.id}`,
        JSON.stringify(updatedPreferences)
      );
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save dashboard preferences",
        variant: "destructive",
      });
    }
  };

  const resetPreferences = async () => {
    await savePreferences(DEFAULT_PREFERENCES);
    toast({
      title: "Success",
      description: "Dashboard preferences reset to default",
    });
  };

  return {
    preferences,
    loading,
    savePreferences,
    resetPreferences
  };
};