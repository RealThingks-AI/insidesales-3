
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const DefaultEmailTemplates = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Email templates functionality temporarily disabled
      // as the email_templates table doesn't exist in current schema
      console.log('Default email templates functionality is disabled');
    }
  }, [user]);

  return null; // This component doesn't render anything
};

export default DefaultEmailTemplates;
