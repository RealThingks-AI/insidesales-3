
import { Calendar, ExternalLink, User, Building, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GenericTable from '@/components/GenericTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MeetingColumn {
  key: string;
  label: string;
  visible: boolean;
}

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  duration: '15 min' | '30 min' | '1 hour' | '2 hours';
  location: 'Online' | 'In-Person';
  timezone: string;
  participants: string[];
  teams_link?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface MeetingsTableRefactoredProps {
  meetings: Meeting[];
  visibleColumns: MeetingColumn[];
  onEditMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onAddMeeting: () => void;
  selectedItems: string[];
  onToggleSelect: (meetingId: string) => void;
  isDeleting?: boolean;
}

const MeetingsTableRefactored = ({
  meetings,
  visibleColumns,
  onEditMeeting,
  onDeleteMeeting,
  onAddMeeting,
  selectedItems,
  onToggleSelect,
  isDeleting = false
}: MeetingsTableRefactoredProps) => {
  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      console.log('Attempting to delete meeting:', meetingId);
      
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) {
        console.error('Error deleting meeting:', error);
        toast({
          variant: "destructive",
          title: "Error deleting meeting",
          description: error.message,
        });
        return;
      }

      console.log('Meeting deleted successfully');
      toast({
        title: "Meeting deleted",
        description: "Meeting has been successfully deleted.",
      });

      // Call the parent's delete handler for any additional cleanup
      onDeleteMeeting(meetingId);
    } catch (error: any) {
      console.error('Unexpected error deleting meeting:', error);
      toast({
        variant: "destructive",
        title: "Error deleting meeting",
        description: "An unexpected error occurred while deleting the meeting.",
      });
    }
  };

  const renderCellValue = (meeting: Meeting, columnKey: string): React.ReactNode => {
    // Handle special cases first before accessing meeting properties
    if (columnKey === 'start_time') {
      return meeting.start_time ? new Date(`${meeting.date}T${meeting.start_time}`).toLocaleString() : '-';
    }
    
    if (columnKey === 'participants') {
      return meeting.participants && meeting.participants.length > 0 ? `${meeting.participants.length} participant(s)` : '-';
    }
    
    if (columnKey === 'teams_link' && meeting.teams_link) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(meeting.teams_link, '_blank')}
          className="flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Join
        </Button>
      );
    }
    
    // Handle all other basic properties by safely accessing them
    let value: any;
    switch (columnKey) {
      case 'meeting_title':
        value = meeting.meeting_title;
        break;
      case 'date':
        value = meeting.date;
        break;
      case 'duration':
        value = meeting.duration;
        break;
      case 'location':
        value = meeting.location;
        break;
      case 'timezone':
        value = meeting.timezone;
        break;
      case 'created_at':
        value = meeting.created_at ? new Date(meeting.created_at).toLocaleString() : '-';
        break;
      case 'updated_at':
        value = meeting.updated_at ? new Date(meeting.updated_at).toLocaleString() : '-';
        break;
      case 'created_by':
        value = meeting.created_by;
        break;
      default:
        // For any other column, try to access it safely
        value = (meeting as any)[columnKey];
        break;
    }
    
    // Handle all other values - ensure we never return objects
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '-';
      }
      // For any other objects, convert to string representation
      return '-';
    }
    
    // Convert primitive values to strings
    return String(value) || '-';
  };

  return (
    <GenericTable
      data={meetings}
      columns={visibleColumns}
      onEdit={onEditMeeting}
      onDelete={handleDeleteMeeting}
      onAdd={onAddMeeting}
      selectedItems={selectedItems}
      onToggleSelect={onToggleSelect}
      emptyIcon={<Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
      emptyTitle="No meetings found"
      emptyDescription="Get started by scheduling your first meeting."
      renderCellValue={renderCellValue}
      isDeleting={isDeleting}
    />
  );
};

export default MeetingsTableRefactored;
