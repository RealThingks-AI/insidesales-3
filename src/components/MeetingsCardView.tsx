import { Calendar, Clock, MapPin, Users, ExternalLink, Edit, Trash2, Plus, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Checkbox
                  checked={selectedItems.includes(meeting.id)}
                  onCheckedChange={() => onToggleSelect(meeting.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {meeting.meeting_title}
                  </CardTitle>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditMeeting(meeting)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteMeeting(meeting.id)}
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Date and Time */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(meeting.date, meeting.start_time)}</span>
            </div>

            {/* Duration */}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <Badge variant="secondary" className={getDurationColor(meeting.duration)}>
                {meeting.duration}
              </Badge>
            </div>

            {/* Location */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {getLocationIcon(meeting.location)}
              <span>{meeting.location}</span>
              {meeting.timezone && (
                <span className="text-xs text-gray-500">({meeting.timezone})</span>
              )}
            </div>

            
            {/* Organizer */}
            {meeting.organizer_name && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{meeting.organizer_name}</span>
                  {meeting.organizer_email && (
                    <span className="text-xs text-gray-500">{meeting.organizer_email}</span>
                  )}
                </div>
              </div>
            )}

            {/* Participants */}
            {meeting.participants && meeting.participants.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4" />
                  <span>Participants ({meeting.participants.length})</span>
                </div>
                <div className="pl-6 space-y-1">
                  {meeting.participants.map((participant, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span className="truncate">{participant}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {meeting.description && (
              <div className="text-sm text-gray-600 line-clamp-2">
                {meeting.description}
              </div>
            )}

            {/* Teams Link */}
            {meeting.teams_link && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(meeting.teams_link, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MeetingsCardView;