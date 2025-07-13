import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseDealCreationProps {
  meetingId: string;
  meetingTitle: string;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useDealCreation = ({ meetingId, meetingTitle, onSuccess, onOpenChange }: UseDealCreationProps) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateDeal = async (
    dealTitle: string,
    dealDescription: string,
    defaultLead: any,
    meetingData: any
  ) => {
    // Allow creating deals without leads when using meeting information
    if (!defaultLead && !meetingData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No meeting or lead data available to create deal.",
      });
      return;
    }

    if (!meetingId) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Meeting ID is required to create deal.",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to create deals.",
        });
        return;
      }

      const dealData = {
        deal_name: dealTitle,
        stage: 'Discussions',
        related_meeting_id: meetingId,
        related_lead_id: defaultLead?.id || null,
        description: dealDescription || `Deal created from meeting: ${meetingTitle}`,
        created_by: user.id,
        // Initialize with default values for stage progression
        probability: 10, // Default probability for Discussions stage
        currency: 'USD'
      };

      console.log('Creating deal with data:', dealData);

      const { error } = await supabase
        .from('deals')
        .insert(dealData);

      if (error) {
        console.error('Error creating deal:', error);
        throw error;
      }

      toast({
        title: "Deal created successfully",
        description: `Meeting "${meetingTitle}" has been linked to deal: ${dealTitle}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        variant: "destructive",
        title: "Error creating deal",
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    isCreating,
    handleCreateDeal
  };
};