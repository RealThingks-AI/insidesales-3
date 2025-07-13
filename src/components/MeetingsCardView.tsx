import { Calendar, Clock, MapPin, Users, ExternalLink, Edit, Trash2, Plus, User, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { MeetingOutcomeForm } from '@/components/forms/MeetingOutcomeForm';
import { useMeetingOutcomes } from '@/hooks/useMeetingOutcomes';

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
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  organizer_name?: string;
  organizer_email?: string;
}

interface MeetingsCardViewProps {
  meetings: Meeting[];
  onEditMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onAddMeeting: () => void;
  selectedItems: string[];
  onToggleSelect: (meetingId: string) => void;
  isDeleting?: boolean;
}

const MeetingsCardView = ({
  meetings,
  onEditMeeting,
  onDeleteMeeting,
  onAddMeeting,
  selectedItems,
  onToggleSelect,
  isDeleting = false
}: MeetingsCardViewProps) => {
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const { getOutcomeForMeeting, refreshOutcomes } = useMeetingOutcomes();

  const isMeetingPast = (date: string, time: string) => {
    try {
      const meetingDateTime = new Date(`${date}T${time}`);
      return meetingDateTime < new Date();
    } catch {
      return false;
    }
  };

  const handleLogOutcome = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMeeting(meeting);
    setOutcomeDialogOpen(true);
  };

  const getOutcomeBadgeColor = (outcomeType: string) => {
    switch (outcomeType) {
      case 'Positive': return 'bg-green-100 text-green-800';
      case 'Neutral': return 'bg-gray-100 text-gray-800';
      case 'Negative': return 'bg-red-100 text-red-800';
      case 'No Show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return dateTime.toLocaleString();
    } catch {
      return `${date} ${time}`;
    }
  };

  const getLocationIcon = (location: string) => {
    return location === 'Online' ? 
      <ExternalLink className="h-4 w-4" /> : 
      <MapPin className="h-4 w-4" />;
  };

  const getDurationColor = (duration: string) => {
    switch (duration) {
      case '15 min': return 'bg-green-100 text-green-800';
      case '30 min': return 'bg-blue-100 text-blue-800';
      case '1 hour': return 'bg-yellow-100 text-yellow-800';
      case '2 hours': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="p-12 text-center">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {meetings.map((meeting) => {
          const outcome = getOutcomeForMeeting(meeting.id);
          const isPast = isMeetingPast(meeting.date, meeting.start_time);
          
          return (
            <Card 
              key={meeting.id} 
              className="hover:shadow-md transition-shadow cursor-pointer h-80 w-full flex flex-col" 
              onClick={() => onEditMeeting(meeting)}
            >
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    <Checkbox
                      checked={selectedItems.includes(meeting.id)}
                      onCheckedChange={() => onToggleSelect(meeting.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                        {meeting.meeting_title}
                      </CardTitle>
                      {/* Outcome Badge */}
                      {outcome && (
                        <Badge variant="secondary" className={`${getOutcomeBadgeColor(outcome.outcome_type)} text-xs px-2 py-0.5 mt-1`}>
                          Outcome: {outcome.outcome_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    {/* Log Outcome Button - only show if meeting is past and no outcome logged, or if outcome exists (to edit) */}
                    {(isPast && !outcome) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleLogOutcome(meeting, e)}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                        title="Log outcome"
                      >
                        <ClipboardList className="h-3 w-3" />
                      </Button>
                    )}
                    {outcome && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleLogOutcome(meeting, e)}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                        title="Edit outcome"
                      >
                        <ClipboardList className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditMeeting(meeting);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMeeting(meeting.id);
                      }}
                      disabled={isDeleting}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 pt-0 flex-1 flex flex-col overflow-hidden">
                {/* Date and Time */}
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{formatDateTime(meeting.date, meeting.start_time)}</span>
                </div>

                {/* Duration and Location */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-600 flex-shrink-0" />
                    <Badge variant="secondary" className={`${getDurationColor(meeting.duration)} text-xs px-1 py-0.5`}>
                      {meeting.duration}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    {getLocationIcon(meeting.location)}
                    <span>{meeting.location}</span>
                  </div>
                </div>

                {/* Organizer - Show Display Name */}
                {meeting.organizer_name && (
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="font-medium truncate">{meeting.organizer_name}</span>
                  </div>
                )}

                {/* Participants - Always show all participants */}
                {meeting.participants && meeting.participants.length > 0 && (
                  <div className="flex-1 min-h-0">
                    <div className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-1">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      <span>Participants ({meeting.participants.length})</span>
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-20">
                      {meeting.participants.map((participant, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span className="truncate">{participant}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teams Link */}
                {meeting.teams_link && (
                  <div className="pt-1 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(meeting.teams_link, '_blank');
                      }}
                      className="w-full h-6 text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Join
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Meeting Outcome Form Dialog */}
      {selectedMeeting && (
        <MeetingOutcomeForm
          meeting={selectedMeeting}
          outcome={getOutcomeForMeeting(selectedMeeting.id)}
          open={outcomeDialogOpen}
          onOpenChange={setOutcomeDialogOpen}
          onOutcomeSaved={() => {
            refreshOutcomes();
            setSelectedMeeting(null);
          }}
        />
      )}
    </>
  );
};

export default MeetingsCardView;
