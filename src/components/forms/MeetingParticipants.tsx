
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface MeetingParticipantsProps {
  participants: string[];
  onParticipantsChange: (participants: string[]) => void;
}

const MeetingParticipants = ({ participants, onParticipantsChange }: MeetingParticipantsProps) => {
  const [participantInput, setParticipantInput] = useState('');

  const addParticipant = () => {
    if (participantInput.trim() && !participants.includes(participantInput.trim())) {
      onParticipantsChange([...participants, participantInput.trim()]);
      setParticipantInput('');
    }
  };

  const removeParticipant = (participant: string) => {
    onParticipantsChange(participants.filter(p => p !== participant));
  };

  return (
    <div>
      <Label>Participants</Label>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Input
            value={participantInput}
            onChange={(e) => setParticipantInput(e.target.value)}
            placeholder="Enter email address"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
          />
          <Button type="button" onClick={addParticipant} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {participants.map((participant, index) => (
            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
              <span>{participant}</span>
              <button
                type="button"
                onClick={() => removeParticipant(participant)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetingParticipants;
