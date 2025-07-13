import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MeetingOutcome {
  id: string;
  meeting_id: string;
  outcome_type: string;
  summary: string | null;
  next_steps: string | null;
  interested_in_deal: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useMeetingOutcomes = () => {
  const [outcomes, setOutcomes] = useState<Map<string, MeetingOutcome>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchOutcomes = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_outcomes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const outcomesMap = new Map();
      data?.forEach((outcome) => {
        outcomesMap.set(outcome.meeting_id, outcome);
      });
      
      setOutcomes(outcomesMap);
    } catch (error) {
      console.error('Error fetching meeting outcomes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();

    // Set up real-time subscription
    const subscription = supabase
      .channel('meeting-outcomes-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meeting_outcomes'
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setOutcomes(prev => new Map(prev.set(payload.new.meeting_id, payload.new as MeetingOutcome)));
        } else if (payload.eventType === 'DELETE') {
          setOutcomes(prev => {
            const newMap = new Map(prev);
            newMap.delete(payload.old.meeting_id);
            return newMap;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const getOutcomeForMeeting = (meetingId: string): MeetingOutcome | undefined => {
    return outcomes.get(meetingId);
  };

  const refreshOutcomes = () => {
    fetchOutcomes();
  };

  return {
    outcomes,
    loading,
    getOutcomeForMeeting,
    refreshOutcomes,
  };
};