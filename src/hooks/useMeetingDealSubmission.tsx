import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  deal_name: string;
  description?: string;
  related_lead_id?: string;
}

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  contact_owner?: string;
}

interface LeadOwner {
  id: string;
  full_name: string;
}

export const useMeetingDealSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDealUpdate = async (
    dealId: string,
    editableDealTitle: string,
    dealDescription: string,
    linkedLead: Lead | null,
    editableLeadOwner: string,
    leadOwner: LeadOwner | null,
    onSuccess: () => void
  ) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to manage deals.",
        });
        return;
      }

      // Update deal information
      const { error: dealError } = await supabase
        .from('deals')
        .update({
          deal_name: editableDealTitle,
          description: dealDescription,
          modified_at: new Date().toISOString(),
          modified_by: user.id
        })
        .eq('id', dealId);

      if (dealError) {
        console.error('Error updating deal:', dealError);
        throw dealError;
      }

      // Update lead owner if changed and lead exists
      if (linkedLead && editableLeadOwner !== leadOwner?.full_name) {
        // Find the user ID for the new owner name
        const { data: newOwner, error: ownerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('full_name', editableLeadOwner)
          .single();

        if (!ownerError && newOwner) {
          const { error: leadError } = await supabase
            .from('leads')
            .update({
              contact_owner: newOwner.id,
              modified_time: new Date().toISOString(),
              modified_by: user.id
            })
            .eq('id', linkedLead.id);

          if (leadError) {
            console.error('Error updating lead owner:', leadError);
          }
        }
      }

      toast({
        title: "Deal updated successfully",
        description: "Deal information has been updated.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        variant: "destructive",
        title: "Error updating deal",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDealMeetingUpdate = async (
    dealId: string,
    dealDescription: string,
    onSuccess: () => void
  ) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to manage deals.",
        });
        return;
      }

      const { error: dealError } = await supabase
        .from('deals')
        .update({
          description: dealDescription,
          modified_at: new Date().toISOString(),
          modified_by: user.id
        })
        .eq('id', dealId);

      if (dealError) {
        console.error('Error updating deal:', dealError);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Meeting updated but failed to update deal description.",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error updating deal description:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitDealUpdate,
    submitDealMeetingUpdate
  };
};