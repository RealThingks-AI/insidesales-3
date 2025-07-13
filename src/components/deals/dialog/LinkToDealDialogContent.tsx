import { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface LinkToDealDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  onSuccess: () => void;
}

export const LinkToDealDialogContent = ({ 
  open, 
  onOpenChange, 
  meetingId, 
  meetingTitle, 
  onSuccess 
}: LinkToDealDialogContentProps) => {
  const { user } = useAuth();
  const [dealTitle, setDealTitle] = useState('');
  const [company, setCompany] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadOwner, setLeadOwner] = useState('');
  const [notesSummary, setNotesSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Load meeting data and outcome when dialog opens
  useEffect(() => {
    if (open && meetingId) {
      loadMeetingData();
    }
  }, [open, meetingId]);

  const loadMeetingData = async () => {
    try {
      setIsLoading(true);
      
      // Get meeting data
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (meetingError) throw meetingError;

      // Get meeting outcome for notes
      const { data: outcome } = await supabase
        .from('meeting_outcomes')
        .select('summary')
        .eq('meeting_id', meetingId)
        .single();

      // Get meeting creator profile for lead owner
      const { data: creator } = await supabase
        .from('profiles')
        .select('full_name, "Email ID"')
        .eq('id', meeting.created_by)
        .single();

      // Get lead information if participants contain email/name
      let leadDisplayName = '';
      if (meeting.participants && meeting.participants.length > 0) {
        const firstParticipant = meeting.participants[0];
        // Check if participant is an email, try to get display name from profiles
        if (firstParticipant.includes('@')) {
          const { data: leadProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('Email ID', firstParticipant)
            .single();
          leadDisplayName = leadProfile?.full_name || firstParticipant.split('@')[0];
        } else {
          leadDisplayName = firstParticipant;
        }
      }

      // Extract company name from meeting title or description
      const extractedCompany = extractCompanyFromMeeting(meeting);

      // Set form data
      setDealTitle(`Deal from ${meeting.meeting_title}`);
      setCompany(extractedCompany);
      setLeadName(leadDisplayName);
      // Create a proper display name from the creator data
      let displayName = 'Unknown';
      if (creator?.full_name && creator.full_name !== creator?.["Email ID"]) {
        // Use full_name if it's different from email
        displayName = creator.full_name;
      } else if (creator?.["Email ID"]) {
        // Extract name from email (part before @)
        displayName = creator["Email ID"].split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      setLeadOwner(displayName);
      setNotesSummary(outcome?.summary || '');

    } catch (error) {
      console.error('Error loading meeting data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load meeting data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractCompanyFromMeeting = (meeting: any) => {
    // Try to extract company name from meeting title
    // This is a simple heuristic - could be improved based on actual data patterns
    const title = meeting.meeting_title || '';
    const description = meeting.description || '';
    
    // Look for common patterns like "Meeting with [Company]" or "[Company] Discussion"
    const companyPattern = /(?:with|at|from)\s+([A-Z][a-zA-Z\s&]+(?:Ltd|Inc|Corp|Company|Solutions|Technologies|Systems)?)/i;
    const match = title.match(companyPattern) || description.match(companyPattern);
    
    return match ? match[1].trim() : 'Not specified';
  };

  const handleCreateDeal = async () => {
    if (!dealTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Deal Title Required",
        description: "Please enter a deal title.",
      });
      return;
    }

    setIsCreating(true);
    try {
      // First, create a lead record if we have lead information
      let leadId = null;
      
      if (leadName.trim() || company.trim()) {
        // Get the lead owner's user ID
        let leadOwnerId = user?.id; // Default to current user
        
        if (leadOwner && leadOwner !== 'Unknown') {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('full_name', leadOwner)
            .single();
          
          if (ownerProfile) {
            leadOwnerId = ownerProfile.id;
          }
        }

        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .insert([{
            lead_name: leadName.trim() || 'Lead from Meeting',
            company_name: company.trim() || undefined,
            contact_owner: leadOwnerId,
            created_by: user?.id,
            description: `Lead created from meeting: ${meetingTitle}`,
          }])
          .select()
          .single();

        if (leadError) {
          console.error('Error creating lead:', leadError);
          // Continue without lead if creation fails
        } else {
          leadId = leadData.id;
        }
      }

      // Create the deal
      const { error } = await supabase
        .from('deals')
        .insert([{
          deal_name: dealTitle,
          stage: 'Discussions',
          related_meeting_id: meetingId,
          related_lead_id: leadId,
          created_by: user?.id,
          description: notesSummary,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deal successfully created from meeting",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create deal.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Link Meeting to Deals Pipeline</DialogTitle>
      </DialogHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading meeting data...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="deal-title">Deal Title *</Label>
            <Input
              id="deal-title"
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              placeholder="Enter deal title"
            />
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              readOnly
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="lead-name">Lead Name</Label>
            <Input
              id="lead-name"
              value={leadName}
              readOnly
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="lead-owner">Lead Owner</Label>
            <Input
              id="lead-owner"
              value={leadOwner}
              readOnly
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="notes-summary">Notes / Summary</Label>
            <Textarea
              id="notes-summary"
              value={notesSummary}
              onChange={(e) => setNotesSummary(e.target.value)}
              placeholder="Enter meeting notes or summary"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDeal} 
              disabled={isCreating || !dealTitle.trim()}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
};