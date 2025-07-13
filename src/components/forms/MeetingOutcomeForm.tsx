import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import LinkToDealDialog from '@/components/deals/LinkToDealDialog';

interface MeetingOutcome {
  id: string;
  meeting_id: string;
  outcome_type: string;
  summary: string | null;
  next_steps: string | null;
  interested_in_deal: boolean;
}

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  participants: string[];
}

interface MeetingOutcomeFormProps {
  meeting: Meeting;
  outcome?: MeetingOutcome;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOutcomeSaved: () => void;
}

export const MeetingOutcomeForm = ({
  meeting,
  outcome,
  open,
  onOpenChange,
  onOutcomeSaved,
}: MeetingOutcomeFormProps) => {
  const { user } = useAuth();
  const [outcomeType, setOutcomeType] = useState(outcome?.outcome_type || '');
  const [summary, setSummary] = useState(outcome?.summary || '');
  const [nextSteps, setNextSteps] = useState(outcome?.next_steps || '');
  const [interestedInDeal, setInterestedInDeal] = useState(outcome?.interested_in_deal ? 'yes' : 'no');
  const [saving, setSaving] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);

  const handleSave = async () => {
    if (!outcomeType) {
      toast({
        variant: "destructive",
        title: "Outcome type required",
        description: "Please select an outcome type.",
      });
      return;
    }

    setSaving(true);
    try {
      const outcomeData = {
        meeting_id: meeting.id,
        outcome_type: outcomeType,
        summary: summary || null,
        next_steps: nextSteps || null,
        interested_in_deal: interestedInDeal === 'yes',
        created_by: user?.id,
      };

      if (outcome) {
        // Update existing outcome
        const { error } = await supabase
          .from('meeting_outcomes')
          .update(outcomeData)
          .eq('id', outcome.id);

        if (error) throw error;
        
        toast({
          title: "Outcome updated",
          description: "Meeting outcome has been updated successfully.",
        });
      } else {
        // Create new outcome
        const { error } = await supabase
          .from('meeting_outcomes')
          .insert([outcomeData]);

        if (error) throw error;
        
        toast({
          title: "Outcome logged",
          description: "Meeting outcome has been logged successfully.",
        });
      }

      onOutcomeSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving outcome:', error);
      toast({
        variant: "destructive",
        title: "Error saving outcome",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLinkToDeal = () => {
    onOpenChange(false);
    setShowDealDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {outcome ? 'Edit Meeting Outcome' : 'Log Meeting Outcome'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="outcome-type">Outcome Type *</Label>
              <Select value={outcomeType} onValueChange={setOutcomeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Positive">Positive</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Negative">Negative</SelectItem>
                  <SelectItem value="No Show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="summary">Notes / Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter meeting notes or summary..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="next-steps">Next Steps</Label>
              <Input
                id="next-steps"
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Enter next steps (optional)"
              />
            </div>

            <div>
              <Label>Interested in Deal?</Label>
              <RadioGroup value={interestedInDeal} onValueChange={setInterestedInDeal} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">No</Label>
                </div>
              </RadioGroup>
            </div>

            {interestedInDeal === 'yes' && (
              <Button 
                variant="outline" 
                onClick={handleLinkToDeal}
                className="w-full"
              >
                Link to Deals Pipeline
              </Button>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : outcome ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LinkToDealDialog
        open={showDealDialog}
        onOpenChange={setShowDealDialog}
        meetingId={meeting.id}
        meetingTitle={meeting.meeting_title}
        onSuccess={() => {
          setShowDealDialog(false);
          toast({
            title: "Deal linked",
            description: "Meeting has been linked to a deal successfully.",
          });
        }}
      />
    </>
  );
};