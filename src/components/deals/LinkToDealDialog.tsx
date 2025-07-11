
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LinkToDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  onSuccess: () => void;
}

const LinkToDealDialog = ({ open, onOpenChange, meetingId, meetingTitle, onSuccess }: LinkToDealDialogProps) => {
  const [defaultLead, setDefaultLead] = useState<any>(null);
  const [leadOwner, setLeadOwner] = useState<any>(null);
  const [dealTitle, setDealTitle] = useState(`Deal from ${meetingTitle}`);
  const [dealDescription, setDealDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meetingData, setMeetingData] = useState<any>(null);

  // Consolidated data fetching function
  const fetchAllData = async () => {
    if (!open || !meetingId) return;

    setIsLoading(true);
    
    try {
      console.log('Fetching all data for meeting ID:', meetingId);
      
      // Fetch meeting data first
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .maybeSingle();

      let selectedLead = null;
      let owner = null;
      
      if (!meetingError && meeting) {
        setMeetingData(meeting);
        
        // Try to find related lead by participant email
        if (meeting.participants && meeting.participants.length > 0) {
          for (const participant of meeting.participants) {
            const { data: lead } = await supabase
              .from('leads')
              .select('*')
              .eq('email', participant)
              .maybeSingle();

            if (lead) {
              selectedLead = lead;
              console.log('Found related lead by email:', lead);
              break;
            }
          }
        }
      }

      // If no related lead found, get first available lead
      if (!selectedLead) {
        console.log('No related lead found, fetching default lead');
        const { data: defaultLeadData } = await supabase
          .from('leads')
          .select('*')
          .limit(1)
          .maybeSingle();
          
        selectedLead = defaultLeadData;
      }

      // Fetch lead owner if lead exists and has contact_owner
      if (selectedLead?.contact_owner) {
        try {
          const { data, error } = await supabase.functions.invoke('get-user-display-names', {
            body: { userIds: [selectedLead.contact_owner] }
          });

          if (!error && data?.userDisplayNames?.[selectedLead.contact_owner]) {
            owner = {
              id: selectedLead.contact_owner,
              full_name: data.userDisplayNames[selectedLead.contact_owner]
            };
          }
        } catch (error) {
          console.error('Error fetching lead owner:', error);
        }
      }

      // Set all data at once to prevent multiple re-renders
      const newDealTitle = selectedLead 
        ? `Deal with ${selectedLead.lead_name || selectedLead.company_name || 'Lead'}`
        : `Deal from ${meetingTitle}`;
        
      setDefaultLead(selectedLead);
      setLeadOwner(owner);
      setDealTitle(newDealTitle);
      setDealDescription('');
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset and fetch data when dialog opens
  useEffect(() => {
    if (open) {
      // Reset all state immediately
      setDefaultLead(null);
      setLeadOwner(null);
      setMeetingData(null);
      setDealTitle(`Deal from ${meetingTitle}`);
      setDealDescription('');
      
      // Fetch data
      fetchAllData();
    }
  }, [open, meetingId, meetingTitle]);

  const handleCreateDeal = async () => {
    if (!defaultLead) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No lead available to create deal. Please create a lead first.",
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
        related_lead_id: defaultLead.id,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Meeting to Deals Pipeline</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading meeting data...</span>
          </div>
        ) : (
          <div className="space-y-6">

          {/* Title Field */}
          <div>
            <Label htmlFor="deal-title">Deal Title</Label>
            <Input
              id="deal-title"
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              placeholder="Enter deal title"
            />
          </div>

          {/* Default Lead Information - Only Essential Fields */}
          {defaultLead ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                {meetingData ? 'Related Lead Information' : 'Default Lead Information'}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Lead Name</Label>
                  <Input
                    value={defaultLead.lead_name || ''}
                    readOnly
                    className="bg-white"
                  />
                </div>
                
                {defaultLead.company_name && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                    <Input
                      value={defaultLead.company_name}
                      readOnly
                      className="bg-white"
                    />
                  </div>
                )}
                
                {leadOwner && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Lead Owner</Label>
                    <Input
                      value={leadOwner.full_name}
                      readOnly
                      className="bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-700">
                No leads available. Please create a lead first before linking to deals pipeline.
              </p>
            </div>
          )}

          {/* Description Field */}
          <div>
            <Label htmlFor="deal-description">Deal Description</Label>
            <Textarea
              id="deal-description"
              value={dealDescription}
              onChange={(e) => setDealDescription(e.target.value)}
              placeholder="Enter initial deal description or meeting notes..."
              rows={4}
            />
          </div>


          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating || isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDeal}
              disabled={isCreating || isLoading || !defaultLead}
            >
              {isCreating ? 'Creating Deal...' : 'Create Deal'}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LinkToDealDialog;
