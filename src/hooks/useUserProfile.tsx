import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setDisplayName('');
        setLoading(false);
        return;
      }

      try {
        // Always prioritize auth user metadata
        const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (metadataName) {
          setDisplayName(metadataName);
          setLoading(false);
          return;
        }

        // If no metadata, extract name from email (before @ symbol)
        if (user.email) {
          const emailName = user.email.split('@')[0];
          // Convert email format to display name (e.g., peter.jakobsson -> Peter Jakobsson)
          const displayName = emailName
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          setDisplayName(displayName);
          setLoading(false);
          return;
        }

        // Final fallback
        setDisplayName('User');
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setDisplayName(user.email?.split('@')[0] || 'User');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  return { displayName, loading };
};