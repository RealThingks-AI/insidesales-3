
import { Calendar, ExternalLink, User, Building, DollarSign, Edit, Trash2, MoreHorizontal, CheckCircle, Clock, Users, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMeetingOutcomes } from '@/hooks/useMeetingOutcomes';
import { MeetingOutcomeForm } from '@/components/forms/MeetingOutcomeForm';
import LinkToDealDialog from '@/components/deals/LinkToDealDialog';
import { useState } from 'react';

interface MeetingColumn {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
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
  organizer_name?: string;
  organizer_email?: string;
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
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingOutcome, setEditingOutcome] = useState<any>(null);
  
  const { outcomes, refreshOutcomes } = useMeetingOutcomes();
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

  const isPastMeeting = (meeting: Meeting) => {
    const meetingDateTime = new Date(`${meeting.date}T${meeting.start_time}`);
    return meetingDateTime < new Date();
  };

  const isMeetingCompleted = (meeting: Meeting) => {
    const meetingDateTime = new Date(`${meeting.date}T${meeting.start_time}`);
    const durationInMs = getDurationInMs(meeting.duration);
    const endTime = new Date(meetingDateTime.getTime() + durationInMs);
    return endTime < new Date();
  };

  const getDurationInMs = (duration: string) => {
    switch (duration) {
      case '15 min': return 15 * 60 * 1000;
      case '30 min': return 30 * 60 * 1000;
      case '1 hour': return 60 * 60 * 1000;
      case '2 hours': return 120 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  const getMeetingOutcome = (meetingId: string) => {
    return outcomes.get(meetingId);
  };

  const handleLogOutcome = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditingOutcome(null);
    setShowOutcomeDialog(true);
  };

  const handleEditOutcome = (meeting: Meeting) => {
    const outcome = getMeetingOutcome(meeting.id);
    setSelectedMeeting(meeting);
    setEditingOutcome(outcome);
    setShowOutcomeDialog(true);
  };

  const handleLinkToDeal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowLinkDialog(true);
  };

  const handleOutcomeSuccess = () => {
    setShowOutcomeDialog(false);
    setSelectedMeeting(null);
    setEditingOutcome(null);
    refreshOutcomes();
  };


  const renderActions = (meeting: Meeting) => {
    const outcome = getMeetingOutcome(meeting.id);
    const isCompleted = isMeetingCompleted(meeting);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!isCompleted && (
            <DropdownMenuItem onClick={() => onEditMeeting(meeting)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Meeting
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => onDeleteMeeting(meeting.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Meeting
          </DropdownMenuItem>
          
          {meeting.teams_link && (
            <DropdownMenuItem onClick={() => window.open(meeting.teams_link, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Meeting
            </DropdownMenuItem>
          )}
          
          {outcome?.interested_in_deal && (
            <DropdownMenuItem onClick={() => handleLinkToDeal(meeting)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Link to Deal
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderTableHeaders = () => {
    const headers = [
      <TableHead key="checkbox" className="w-12">
        <Checkbox 
          checked={selectedItems.length === meetings.length && meetings.length > 0}
          onCheckedChange={(checked) => {
            if (checked) {
              meetings.forEach(meeting => {
                if (!selectedItems.includes(meeting.id)) {
                  onToggleSelect(meeting.id);
                }
              });
            } else {
              selectedItems.forEach(id => onToggleSelect(id));
            }
          }}
        />
      </TableHead>
    ];

    visibleColumns.forEach(column => {
      switch (column.key) {
        case 'meeting_title':
          headers.push(<TableHead key="title">Title</TableHead>);
          break;
        case 'date_time':
          headers.push(<TableHead key="date_time">Date & Time</TableHead>);
          break;
        case 'duration':
          headers.push(<TableHead key="duration">Duration</TableHead>);
          break;
        case 'location':
          headers.push(<TableHead key="location">Location</TableHead>);
          break;
        case 'organizer':
          headers.push(<TableHead key="organizer">Organizer</TableHead>);
          break;
        case 'participants':
          headers.push(<TableHead key="participants">Participants</TableHead>);
          break;
        case 'status':
          headers.push(<TableHead key="status">Status</TableHead>);
          break;
        case 'log_outcome':
          headers.push(<TableHead key="log_outcome">Log Outcome</TableHead>);
          break;
      }
    });

    headers.push(<TableHead key="actions" className="w-20">Actions</TableHead>);
    return headers;
  };

  const renderTableCells = (meeting: Meeting) => {
    const outcome = getMeetingOutcome(meeting.id);
    const isCompleted = isMeetingCompleted(meeting);
    
    const cells = [
      <TableCell key="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={selectedItems.includes(meeting.id)}
          onCheckedChange={() => onToggleSelect(meeting.id)}
        />
      </TableCell>
    ];

    visibleColumns.forEach(column => {
      switch (column.key) {
        case 'meeting_title':
          cells.push(
            <TableCell key="title" className="font-medium">
              <div className="flex items-center gap-2">
                {meeting.meeting_title}
                {outcome && (
                  <Badge variant="secondary" className="text-xs">
                    Outcome Logged
                  </Badge>
                )}
              </div>
            </TableCell>
          );
          break;
        case 'date_time':
          cells.push(
            <TableCell key="date_time">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(`${meeting.date}T${meeting.start_time}`).toLocaleString()}</span>
              </div>
            </TableCell>
          );
          break;
        case 'duration':
          cells.push(<TableCell key="duration">{meeting.duration}</TableCell>);
          break;
        case 'location':
          cells.push(
            <TableCell key="location">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{meeting.location}</span>
              </div>
            </TableCell>
          );
          break;
        case 'organizer':
          cells.push(
            <TableCell key="organizer">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{meeting.organizer_name || 'Unknown User'}</span>
              </div>
            </TableCell>
          );
          break;
        case 'participants':
          cells.push(
            <TableCell key="participants">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{meeting.participants?.join(', ') || 'No participants'}</span>
              </div>
            </TableCell>
          );
          break;
        case 'status':
          cells.push(
            <TableCell key="status">
              <Badge variant={isCompleted ? "secondary" : "default"}>
                {isCompleted ? (
                  <><Clock className="h-3 w-3 mr-1" />Completed</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" />Upcoming</>
                )}
              </Badge>
            </TableCell>
          );
          break;
        case 'log_outcome':
          cells.push(
            <TableCell key="log_outcome">
              {isCompleted && !outcome && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogOutcome(meeting);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Log Outcome
                </Button>
              )}
              {outcome && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditOutcome(meeting);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Outcome
                </Button>
              )}
            </TableCell>
          );
          break;
      }
    });

    cells.push(
      <TableCell key="actions" onClick={(e) => e.stopPropagation()}>
        {renderActions(meeting)}
      </TableCell>
    );

    return cells;
  };

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
        <p className="text-gray-600 mb-4">Get started by scheduling your first meeting.</p>
        <Button onClick={onAddMeeting}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meeting
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {renderTableHeaders()}
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => {
              const isCompleted = isMeetingCompleted(meeting);
              
              return (
                <TableRow 
                  key={meeting.id}
                  className={`cursor-pointer hover:bg-muted/50 ${isCompleted ? 'opacity-75' : ''}`}
                  onClick={() => !isCompleted && onEditMeeting(meeting)}
                >
                  {renderTableCells(meeting)}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Meeting Outcome Dialog */}
      {selectedMeeting && (
        <MeetingOutcomeForm
          meeting={selectedMeeting}
          outcome={editingOutcome}
          open={showOutcomeDialog}
          onOpenChange={setShowOutcomeDialog}
          onOutcomeSaved={handleOutcomeSuccess}
        />
      )}

      {/* Link to Deal Dialog */}
      {selectedMeeting && (
        <LinkToDealDialog
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          meetingId={selectedMeeting.id}
          meetingTitle={selectedMeeting.meeting_title}
          onSuccess={() => {
            setShowLinkDialog(false);
            setSelectedMeeting(null);
          }}
        />
      )}
    </>
  );
};

export default MeetingsTableRefactored;
