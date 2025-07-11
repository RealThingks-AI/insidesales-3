
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Users, UserCheck } from 'lucide-react';

interface BulkActionsProps {
  selectedItems: string[];
  onSelectAll: (selectAll: boolean) => void;
  onDelete: (ids: string[]) => void;
  onChangeOwner?: (ids: string[], ownerId: string) => void;
  onUpdateStatus?: (ids: string[], status: string) => void;
  isAllSelected: boolean;
  totalItems: number;
  statusOptions?: { value: string; label: string }[];
  ownerOptions?: { value: string; label: string }[];
}

const BulkActions = ({
  selectedItems,
  onSelectAll,
  onDelete,
  onChangeOwner,
  onUpdateStatus,
  isAllSelected,
  totalItems,
  statusOptions = [],
  ownerOptions = []
}: BulkActionsProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<string>('');

  const handleStatusUpdate = () => {
    if (selectedStatus && onUpdateStatus) {
      onUpdateStatus(selectedItems, selectedStatus);
      setSelectedStatus('');
    }
  };

  const handleOwnerChange = () => {
    if (selectedOwner && onChangeOwner) {
      onChangeOwner(selectedItems, selectedOwner);
      setSelectedOwner('');
    }
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
          />
          <span className="text-sm text-gray-600">
            {selectedItems.length > 0 
              ? `${selectedItems.length} of ${totalItems} selected`
              : `Select all ${totalItems} items`
            }
          </span>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="flex items-center space-x-2">
          {/* Status Update */}
          {statusOptions.length > 0 && onUpdateStatus && (
            <div className="flex items-center space-x-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStatusUpdate}
                disabled={!selectedStatus}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Update
              </Button>
            </div>
          )}

          {/* Owner Change - Only show if there are actual owner options */}
          {ownerOptions.length > 0 && onChangeOwner && (
            <div className="flex items-center space-x-2">
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Change Owner" />
                </SelectTrigger>
                <SelectContent>
                  {ownerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOwnerChange}
                disabled={!selectedOwner}
              >
                <Users className="h-4 w-4 mr-1" />
                Change
              </Button>
            </div>
          )}

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selectedItems.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedItems.length} selected item(s)? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(selectedItems)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default BulkActions;
