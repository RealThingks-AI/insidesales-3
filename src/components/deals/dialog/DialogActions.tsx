import { Button } from '@/components/ui/button';

interface DialogActionsProps {
  isCreating: boolean;
  isLoading: boolean;
  defaultLead: any;
  meetingData: any;
  onCancel: () => void;
  onCreateDeal: () => void;
}

export const DialogActions = ({ 
  isCreating, 
  isLoading, 
  defaultLead, 
  meetingData, 
  onCancel, 
  onCreateDeal 
}: DialogActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isCreating || isLoading}
      >
        Cancel
      </Button>
      <Button 
        onClick={onCreateDeal}
        disabled={isCreating || isLoading || (!defaultLead && !meetingData)}
      >
        {isCreating ? 'Creating Deal...' : 'Create Deal'}
      </Button>
    </div>
  );
};