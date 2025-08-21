
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUserDisplayNames } from '@/hooks/useUserDisplayNames';
import { Deal } from '@/types/deal';
import { cn } from '@/lib/utils';

interface DealActionItem {
  id: string;
  deal_id: string;
  next_action: string;
  assigned_to: string | null;
  due_date: string | null;
  status: 'Open' | 'Ongoing' | 'Closed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DealActionItemsModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DealActionItemsModal = ({ deal, isOpen, onClose }: DealActionItemsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [actionItems, setActionItems] = useState<DealActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newActionItem, setNewActionItem] = useState<{
    next_action: string;
    assigned_to: string;
    due_date: Date | undefined;
    status: 'Open' | 'Ongoing' | 'Closed';
  }>({
    next_action: '',
    assigned_to: '',
    due_date: undefined,
    status: 'Open'
  });

  // Get all unique user IDs from action items for display names
  const userIds = Array.from(new Set([
    ...actionItems.map(item => item.assigned_to).filter(Boolean),
    ...actionItems.map(item => item.created_by).filter(Boolean)
  ])) as string[];

  const { displayNames } = useUserDisplayNames(userIds);

  const fetchActionItems = async () => {
    if (!deal?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deal_action_items')
        .select('*')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast with proper status validation
      const typedData = (data || []).map(item => ({
        ...item,
        status: ['Open', 'Ongoing', 'Closed'].includes(item.status) ? 
          item.status as 'Open' | 'Ongoing' | 'Closed' : 'Open'
      }));
      
      setActionItems(typedData);
    } catch (error) {
      console.error('Error fetching action items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch action items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddActionItem = async () => {
    if (!deal?.id || !user?.id || !newActionItem.next_action.trim()) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('deal_action_items')
        .insert([{
          deal_id: deal.id,
          next_action: newActionItem.next_action.trim(),
          assigned_to: newActionItem.assigned_to || null,
          due_date: newActionItem.due_date ? format(newActionItem.due_date, 'yyyy-MM-dd') : null,
          status: newActionItem.status,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const typedData = {
        ...data,
        status: data.status as 'Open' | 'Ongoing' | 'Closed'
      };

      setActionItems(prev => [typedData, ...prev]);
      setNewActionItem({
        next_action: '',
        assigned_to: '',
        due_date: undefined,
        status: 'Open'
      });

      toast({
        title: "Success",
        description: "Action item added successfully",
      });
    } catch (error) {
      console.error('Error adding action item:', error);
      toast({
        title: "Error",
        description: "Failed to add action item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteActionItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deal_action_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setActionItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Action item deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting action item:', error);
      toast({
        title: "Error",
        description: "Failed to delete action item",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Open' | 'Ongoing' | 'Closed') => {
    try {
      const { error } = await supabase
        .from('deal_action_items')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setActionItems(prev => prev.map(item => 
        item.id === id ? { ...item, status } : item
      ));

      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen && deal) {
      fetchActionItems();
    }
  }, [isOpen, deal]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-red-600 bg-red-50';
      case 'Ongoing': return 'text-yellow-600 bg-yellow-50';
      case 'Closed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Action Items - {deal?.deal_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Action Item Form */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Add New Action Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="next_action">Next Action *</Label>
                <Textarea
                  id="next_action"
                  placeholder="Describe the next action to be taken..."
                  value={newActionItem.next_action}
                  onChange={(e) => setNewActionItem(prev => ({ ...prev, next_action: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select
                  value={newActionItem.assigned_to}
                  onValueChange={(value) => setNewActionItem(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(displayNames).map(([userId, displayName]) => (
                      <SelectItem key={userId} value={userId}>
                        {displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newActionItem.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newActionItem.due_date ? format(newActionItem.due_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newActionItem.due_date}
                      onSelect={(date) => setNewActionItem(prev => ({ ...prev, due_date: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newActionItem.status}
                  onValueChange={(value) => 
                    setNewActionItem(prev => ({ ...prev, status: value as 'Open' | 'Ongoing' | 'Closed' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleAddActionItem} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Action Item
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Action Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Existing Action Items</h3>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : actionItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No action items found</div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.next_action}</p>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.assigned_to && displayNames[item.assigned_to] && (
                            <span>Assigned to: {displayNames[item.assigned_to]} • </span>
                          )}
                          {item.due_date && (
                            <span>Due: {format(new Date(item.due_date), 'PPP')} • </span>
                          )}
                          <span>Created: {format(new Date(item.created_at), 'PPP')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Select
                          value={item.status}
                          onValueChange={(value) => 
                            handleUpdateStatus(item.id, value as 'Open' | 'Ongoing' | 'Closed')
                          }
                        >
                          <SelectTrigger className={cn("w-24 h-8 text-xs", getStatusColor(item.status))}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Ongoing">Ongoing</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActionItem(item.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
