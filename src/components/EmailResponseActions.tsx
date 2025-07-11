
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, UserPlus, Tag, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EmailResponseActionsProps {
  emailId: string;
  contactId: string;
  contactName: string;
  onActionComplete: () => void;
}

const EmailResponseActions = ({ 
  emailId, 
  contactId, 
  contactName, 
  onActionComplete 
}: EmailResponseActionsProps) => {
  const [showInterested, setShowInterested] = useState(false);
  const [showNotInterested, setShowNotInterested] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date>();
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [tagReason, setTagReason] = useState('');
  const { user } = useAuth();

  const handleInterested = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update contact status to show interest
      await supabase
        .from('contacts')
        .update({ 
          lead_status: 'Qualified',
          interest: 'High',
          modified_time: new Date().toISOString(),
          modified_by: user.id
        })
        .eq('id', contactId);

      // Create a notification for the user
      await supabase
        .from('notifications' as any)
        .insert({
          user_id: user.id,
          title: 'Contact Interested',
          message: `${contactName} has been marked as interested and can be converted to a lead.`,
          type: 'success',
          module_type: 'contact',
          module_id: contactId,
        });

      toast({
        title: "Response recorded",
        description: `${contactName} marked as interested. You can now convert them to a lead.`,
      });

      setShowInterested(false);
      onActionComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error recording response",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotInterested = async () => {
    if (!user || !tagReason.trim()) return;
    
    setLoading(true);
    try {
      // Update contact with not interested status and reason
      await supabase
        .from('contacts')
        .update({ 
          lead_status: 'Lost',
          interest: 'None',
          description: `Not interested: ${tagReason}. ${new Date().toLocaleDateString()}`,
          modified_time: new Date().toISOString(),
          modified_by: user.id
        })
        .eq('id', contactId);

      // Create a notification
      await supabase
        .from('notifications' as any)
        .insert({
          user_id: user.id,
          title: 'Contact Not Interested',
          message: `${contactName} marked as not interested: ${tagReason}`,
          type: 'info',
          module_type: 'contact',
          module_id: contactId,
        });

      toast({
        title: "Response recorded",
        description: `${contactName} marked as not interested and tagged.`,
      });

      setShowNotInterested(false);
      setTagReason('');
      onActionComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error recording response",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!user || !followUpDate) return;
    
    setLoading(true);
    try {
      // Create a task for follow-up using raw query
      await supabase
        .from('tasks' as any)
        .insert({
          subject: `Follow up with ${contactName}`,
          description: followUpNotes || `Follow up on email communication with ${contactName}`,
          due_date: followUpDate.toISOString().split('T')[0],
          status: 'Not Started',
          priority: 'Medium',
          contact: contactId,
          created_by: user.id,
          assigned_to: user.id,
        });

      // Create a notification
      await supabase
        .from('notifications' as any)
        .insert({
          user_id: user.id,
          title: 'Follow-up Scheduled',
          message: `Follow-up reminder created for ${contactName} on ${format(followUpDate, 'PPP')}`,
          type: 'info',
          module_type: 'contact',
          module_id: contactId,
        });

      toast({
        title: "Follow-up scheduled",
        description: `Reminder set for ${format(followUpDate, 'PPP')}`,
      });

      setShowFollowUp(false);
      setFollowUpDate(undefined);
      setFollowUpNotes('');
      onActionComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error scheduling follow-up",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email Response Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            How did {contactName} respond to your email?
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => setShowInterested(true)}
              className="flex items-center justify-start"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Interested - Update Status
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowNotInterested(true)}
              className="flex items-center justify-start"
            >
              <Tag className="h-4 w-4 mr-2" />
              Not Interested - Mark as Lost
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowFollowUp(true)}
              className="flex items-center justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              No Response - Set Follow-up Task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interested Dialog */}
      <Dialog open={showInterested} onOpenChange={setShowInterested}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Interested</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Mark {contactName} as interested and update their status to qualified?</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowInterested(false)}>
                Cancel
              </Button>
              <Button onClick={handleInterested} disabled={loading}>
                {loading ? 'Processing...' : 'Mark as Interested'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Not Interested Dialog */}
      <Dialog open={showNotInterested} onOpenChange={setShowNotInterested}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Not Interested</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (required)</Label>
              <Input
                id="reason"
                value={tagReason}
                onChange={(e) => setTagReason(e.target.value)}
                placeholder="e.g., Budget constraints, Not a good fit, etc."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNotInterested(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleNotInterested} 
                disabled={loading || !tagReason.trim()}
              >
                {loading ? 'Processing...' : 'Mark as Not Interested'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={showFollowUp} onOpenChange={setShowFollowUp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followUpDate ? format(followUpDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={followUpDate}
                    onSelect={setFollowUpDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Additional follow-up notes..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFollowUp(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleFollowUp} 
                disabled={loading || !followUpDate}
              >
                {loading ? 'Creating Task...' : 'Create Follow-up Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmailResponseActions;
