
import { Dialog } from '@/components/ui/dialog';
import { LinkToDealDialogContent } from './dialog/LinkToDealDialogContent';

interface LinkToDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  onSuccess: () => void;
}

const LinkToDealDialog = ({ open, onOpenChange, meetingId, meetingTitle, onSuccess }: LinkToDealDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <LinkToDealDialogContent
        open={open}
        onOpenChange={onOpenChange}
        meetingId={meetingId}
        meetingTitle={meetingTitle}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
};

export default LinkToDealDialog;
