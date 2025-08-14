
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  display_name: string;
  email: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // First get users from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, "Email ID"')
        .order('full_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setUsers([]);
        return;
      }

      const usersList = profiles?.map(profile => ({
        id: profile.id,
        display_name: profile.full_name || profile['Email ID'] || 'Unknown User',
        email: profile['Email ID'] || ''
      })) || [];

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading };
};
