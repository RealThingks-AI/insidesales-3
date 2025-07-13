import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCurrentUserRole = () => {
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole('member');
        setIsLoading(false);
        return;
      }

      try {
        // Get the current user's metadata which contains the role
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching current user:', error);
          setRole('member');
        } else if (currentUser) {
          // Check role from user_metadata
          const userRole = currentUser.user_metadata?.role || 'member';
          setRole(userRole);
        } else {
          setRole('member');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('member');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';

  return {
    role,
    isAdmin,
    isLoading
  };
};