import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { MAJOR_TIMEZONES, getUserTimezone } from '@/utils/timezones';

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
}

interface EditMeetingFormProps {
  meeting: Meeting;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditMeetingForm = ({ meeting, onSuccess, onCancel }: EditMeetingFormProps) => {
  const [formData, setFormData] = useState({
    meeting_title: meeting.meeting_title || '',
    date: meeting.date || '',
    start_time: meeting.start_time || '',
    duration: meeting.duration || '1 hour' as '15 min' | '30 min' | '1 hour' | '2 hours',
    location: meeting.location || 'Online' as 'Online' | 'In-Person',
    timezone: meeting.timezone || getUserTimezone(),
    participants: meeting.participants || [],
    teams_link: meeting.teams_link || '',
    description: meeting.description || ''
  });
  
  const [participantInput, setParticipantInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addParticipant = () => {
    if (participantInput.trim() && !formData.participants.includes(participantInput.trim())) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, participantInput.trim()]
      }));
      setParticipantInput('');
    }
  };

  const removeParticipant = (participant: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== participant)
    }));
  };

  const updateTeamsLink = async () => {
    if (!formData.meeting_title || !formData.date || !formData.start_time) {
      return null;
    }

    try {
      // Create proper datetime strings in ISO format
      const startDateTime = new Date(`${formData.date}T${formData.start_time}:00`);
      
      // Calculate end time based on duration
      const durationMinutes = {
        '15 min': 15,
        '30 min': 30,
        '1 hour': 60,
        '2 hours': 120
      }[formData.duration];
      
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      // Format dates properly for Microsoft Graph API
      const startTimeISO = startDateTime.toISOString();
      const endTimeISO = endDateTime.toISOString();

      console.log('Updating Teams meeting with data:', {
        subject: formData.meeting_title,
        startTime: startTimeISO,
        endTime: endTimeISO,
        attendees: formData.participants,
        location: formData.location,
        timeZone: formData.timezone
      });

      const { data, error } = await supabase.functions.invoke('create-teams-meeting', {
        body: {
          subject: formData.meeting_title,
          startTime: startTimeISO,
          endTime: endTimeISO,
          attendees: formData.participants,
          location: formData.location,
          timeZone: formData.timezone
        }
      });

      console.log('Teams meeting update response:', { data, error });

      if (error) {
        console.error('Error updating Teams meeting:', error);
        toast({
          variant: "destructive",
          title: "Teams Meeting Update Error",
          description: "Unable to update Teams meeting. The regular meeting will still be updated.",
        });
        return null;
      }

      if (data?.success && data?.meetingUrl) {
        return data.meetingUrl;
      } else {
        console.error('Teams meeting update failed:', data);
        toast({
          variant: "destructive",
          title: "Teams Meeting Update Error",
          description: "Unable to update Teams meeting. The regular meeting will still be updated.",
        });
        return null;
      }
    } catch (error: any) {
      console.error('Error in updateTeamsLink:', error);
      toast({
        variant: "destructive",
        title: "Teams Meeting Update Error",
        description: "An unexpected error occurred. The regular meeting will still be updated.",
      });
      return null;
    }
  };

  // Get current date and time for validation
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);
    return { date, time };
  };

  const isDateTimeInPast = (selectedDate: string, selectedTime: string) => {
    if (!selectedDate || !selectedTime) return false;
    
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const now = new Date();
    
    return selectedDateTime < now;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date and time
    if (isDateTimeInPast(formData.date, formData.start_time)) {
      toast({
        variant: "destructive",
        title: "Invalid Date/Time",
        description: "Meeting date and time cannot be in the past.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to update a meeting.",
        });
        return;
      }

      let teamsLink = formData.teams_link;
      
      // Update Teams link for online meetings if one exists
      if (formData.location === 'Online' && meeting.teams_link) {
        const updatedTeamsLink = await updateTeamsLink();
        if (updatedTeamsLink) {
          teamsLink = updatedTeamsLink;
          toast({
            title: "Teams meeting updated",
            description: "Microsoft Teams meeting has been updated!",
          });
        }
      }

      const meetingData = {
        meeting_title: formData.meeting_title,
        date: formData.date,
        start_time: formData.start_time,
        duration: formData.duration,
        location: formData.location,
        timezone: formData.timezone,
        participants: formData.participants,
        teams_link: teamsLink,
        description: formData.description,
        updated_at: new Date().toISOString()
      };

      console.log('Updating meeting data:', meetingData);

      const { error } = await supabase
        .from('meetings')
        .update(meetingData)
        .eq('id', meeting.id);

      if (error) {
        console.error('Error updating meeting:', error);
        throw error;
      }

      toast({
        title: "Meeting updated successfully",
        description: teamsLink && teamsLink !== meeting.teams_link
          ? "Meeting has been updated and Teams link has been refreshed!" 
          : "Meeting has been updated successfully!",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast({
        variant: "destructive",
        title: "Error updating meeting",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDateTime = getCurrentDateTime();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meeting_title">Meeting Title *</Label>
              <Input
                id="meeting_title"
                value={formData.meeting_title}
                onChange={(e) => handleInputChange('meeting_title', e.target.value)}
                placeholder="Enter meeting title"
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                min={currentDateTime.date}
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
              {isDateTimeInPast(formData.date, formData.start_time) && (
                <p className="text-sm text-red-600 mt-1">Date and time cannot be in the past</p>
              )}
            </div>

            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                min={formData.date === currentDateTime.date ? currentDateTime.time : undefined}
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Select value={formData.duration} onValueChange={(value: '15 min' | '30 min' | '1 hour' | '2 hours') => handleInputChange('duration', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15 min">15 minutes</SelectItem>
                  <SelectItem value="30 min">30 minutes</SelectItem>
                  <SelectItem value="1 hour">1 hour</SelectItem>
                  <SelectItem value="2 hours">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Details */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Select value={formData.location} onValueChange={(value: 'Online' | 'In-Person') => handleInputChange('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="In-Person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {MAJOR_TIMEZONES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Participants */}
            <div>
              <Label>Participants (Select from Leads) <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    placeholder="Enter lead name to search and add"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                  />
                  <Button type="button" onClick={addParticipant} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.participants.map((participant, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{participant}</span>
                      <button
                        type="button"
                        onClick={() => removeParticipant(participant)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {formData.participants.length === 0 && (
                  <p className="text-sm text-red-500">At least one participant must be selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="description">Meeting Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter meeting description, agenda, or additional notes..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Meeting'}
        </Button>
      </div>
    </form>
  );
};

export default EditMeetingForm;
