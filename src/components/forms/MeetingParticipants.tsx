import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  lead_name: string;
  email: string;
  company_name?: string;
}

interface MeetingParticipantsProps {
  participants: string[]; // This will be lead IDs
  onParticipantsChange: (participants: string[]) => void;
}

const MeetingParticipants = ({ participants, onParticipantsChange }: MeetingParticipantsProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [participantNames, setParticipantNames] = useState<{[key: string]: string}>({});

  // Fetch all leads for selection
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data: leadsData, error } = await supabase
          .from('leads')
          .select('id, lead_name, email, company_name')
          .order('lead_name');

        if (error) {
          console.error('Error fetching leads:', error);
          return;
        }

        setLeads(leadsData || []);
      } catch (error) {
        console.error('Error fetching leads:', error);
      }
    };

    fetchLeads();
  }, []);

  // Fetch names for existing participants
  useEffect(() => {
    const fetchParticipantNames = async () => {
      if (participants.length === 0) return;

      try {
        const { data: leadsData, error } = await supabase
          .from('leads')
          .select('id, lead_name')
          .in('id', participants);

        if (error) {
          console.error('Error fetching participant names:', error);
          return;
        }

        const namesMap: {[key: string]: string} = {};
        leadsData?.forEach(lead => {
          namesMap[lead.id] = lead.lead_name;
        });
        setParticipantNames(namesMap);
      } catch (error) {
        console.error('Error fetching participant names:', error);
      }
    };

    fetchParticipantNames();
  }, [participants]);

  const addParticipant = () => {
    if (selectedLeadId && !participants.includes(selectedLeadId)) {
      onParticipantsChange([...participants, selectedLeadId]);
      setSelectedLeadId('');
    }
  };

  const removeParticipant = (leadId: string) => {
    onParticipantsChange(participants.filter(p => p !== leadId));
  };

  // Filter out already selected leads
  const availableLeads = leads.filter(lead => !participants.includes(lead.id));

  return (
    <div>
      <Label>Participants (Select from Leads) <span className="text-red-500">*</span></Label>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a lead to add as participant" />
            </SelectTrigger>
            <SelectContent>
              {availableLeads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.lead_name}</span>
                    {lead.email && (
                      <span className="text-sm text-muted-foreground">{lead.email}</span>
                    )}
                    {lead.company_name && (
                      <span className="text-sm text-muted-foreground">{lead.company_name}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            onClick={addParticipant} 
            variant="outline"
            disabled={!selectedLeadId}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {participants.map((leadId) => (
            <Badge key={leadId} variant="secondary" className="flex items-center space-x-1">
              <span>{participantNames[leadId] || leadId}</span>
              <button
                type="button"
                onClick={() => removeParticipant(leadId)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        {participants.length === 0 && (
          <p className="text-sm text-red-500">At least one participant must be selected</p>
        )}
      </div>
    </div>
  );
};

export default MeetingParticipants;