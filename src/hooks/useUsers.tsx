
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  display_name: string;
  email?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Fetch all profiles which contain user display information
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, "Email ID"')
          .order('full_name');

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        // Transform profiles data to match User interface
        const transformedUsers: User[] = (profiles || []).map(profile => ({
          id: profile.id,
          display_name: profile.full_name || profile["Email ID"] || 'Unknown User',
          email: profile["Email ID"] || undefined,
        }));

        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error in fetchUsers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading };
};
