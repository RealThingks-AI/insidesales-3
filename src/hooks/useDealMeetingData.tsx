import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DealMeetingData {
  meetingData?: {
    title: string;
    description: string;
    participants: string[];
  };
  leadData?: {
    lead_name: string;
    company_name: string;
    email: string;
    contact_owner: string;
  };
  meetingOutcome?: {
    summary: string;
    outcome_type: string;
    next_steps: string;
  };
  leadOwnerProfile?: {
    full_name: string;
    email: string;
  };
}

export const useDealMeetingData = (dealId: string, relatedMeetingId?: string, relatedLeadId?: string) => {
  const [meetingData, setMeetingData] = useState<DealMeetingData>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (relatedMeetingId || relatedLeadId) {
      fetchMeetingData();
    }
  }, [dealId, relatedMeetingId, relatedLeadId]);

  const fetchMeetingData = async () => {
    setIsLoading(true);
    try {
      const data: DealMeetingData = {};

      // Fetch meeting data if meeting is linked
      if (relatedMeetingId) {
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .select('meeting_title, description, participants')
          .eq('id', relatedMeetingId)
          .single();

        if (!meetingError && meeting) {
          data.meetingData = {
            title: meeting.meeting_title,
            description: meeting.description || '',
            participants: meeting.participants || [],
          };
        }

        // Fetch meeting outcome if available
        const { data: outcome, error: outcomeError } = await supabase
          .from('meeting_outcomes')
          .select('summary, outcome_type, next_steps')
          .eq('meeting_id', relatedMeetingId)
          .single();

        if (!outcomeError && outcome) {
          data.meetingOutcome = outcome;
        }
      }

      // Fetch lead data if lead is linked
      if (relatedLeadId) {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('lead_name, company_name, email, contact_owner')
          .eq('id', relatedLeadId)
          .single();

        if (!leadError && lead) {
          data.leadData = lead;

          // Fetch lead owner profile if contact_owner exists
          if (lead.contact_owner) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, "Email ID"')
              .eq('id', lead.contact_owner)
              .single();

            if (!profileError && profile) {
              data.leadOwnerProfile = {
                full_name: profile.full_name || '',
                email: profile["Email ID"] || '',
              };
            }
          }
        }
      }

      setMeetingData(data);
    } catch (error) {
      console.error('Error fetching meeting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { meetingData, isLoading, refetch: fetchMeetingData };
};