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
import { X, Plus, Link } from 'lucide-react';
import { MAJOR_TIMEZONES, getUserTimezone } from '@/utils/timezones';

interface AddMeetingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialLeadData?: any;
}

const AddMeetingForm = ({ onSuccess, onCancel, initialLeadData }: AddMeetingFormProps) => {
  const [formData, setFormData] = useState({
    meeting_title: '',
    date: '',
    start_time: '',
    duration: '1 hour' as '30 min' | '1 hour',
    location: 'Online' as 'Online' | 'In-Person',
    timezone: getUserTimezone(),
    participants: [] as string[],
    teams_link: '',
    description: ''
  });
  
  const [participantInput, setParticipantInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkingToDeal, setIsLinkingToDeal] = useState(false);
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialLeadData) {
      setFormData(prev => ({
        ...prev,
        meeting_title: `Meeting with ${initialLeadData.lead_name}`,
        participants: initialLeadData.email ? [initialLeadData.email] : []
      }));
    }
  }, [initialLeadData]);

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

  const handleLinkToDeals = async () => {
    if (!createdMeetingId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please save the meeting first before linking to deals.",
      });
      return;
    }

    setIsLinkingToDeal(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to create deals.",
        });
        return;
      }

      const dealData = {
        deal_name: `Deal from ${formData.meeting_title}`,
        stage: 'Discussions',
        related_meeting_id: createdMeetingId,
        description: `Deal created from meeting: ${formData.meeting_title}`,
        created_by: user.id
      };

      const { error } = await supabase
        .from('deals')
        .insert(dealData);

      if (error) throw error;

      toast({
        title: "Deal created successfully",
        description: "Meeting has been linked to a new deal in the Discussions stage.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        variant: "destructive",
        title: "Error creating deal",
        description: error.message,
      });
    } finally {
      setIsLinkingToDeal(false);
    }
  };

  const createTeamsLink = async () => {
    if (!formData.meeting_title || !formData.date || !formData.start_time) {
      return null;
    }

    try {
      // Create proper datetime strings in ISO format
      const startDateTime = new Date(`${formData.date}T${formData.start_time}:00`);
      
      // Calculate end time based on duration
      const durationMinutes = {
        '30 min': 30,
        '1 hour': 60
      }[formData.duration];
      
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      // Format dates properly for Microsoft Graph API
      const startTimeISO = startDateTime.toISOString();
      const endTimeISO = endDateTime.toISOString();

      console.log('Creating Teams meeting with data:', {
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

      console.log('Teams meeting response:', { data, error });

      if (error) {
        console.error('Error creating Teams meeting:', error);
        
        // Show more helpful error messages
        if (error.message?.includes('Access forbidden')) {
          toast({
            variant: "destructive",
            title: "Teams Meeting Setup Required",
            description: "Your Microsoft Graph application needs OnlineMeetings.ReadWrite permission. Please contact your administrator to configure the app registration.",
          });
        } else if (error.message?.includes('Authentication failed')) {
          toast({
            variant: "destructive",
            title: "Teams Authentication Error",
            description: "Please verify your Microsoft Graph API credentials are configured correctly in Supabase secrets.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Teams Meeting Error",
            description: "Unable to create Teams meeting. The regular meeting will still be saved.",
          });
        }
        return null;
      }

      if (data?.success && data?.meetingUrl) {
        return data.meetingUrl;
      } else {
        console.error('Teams meeting creation failed:', data);
        
        // Show detailed error information if available
        if (data?.troubleshooting) {
          console.log('Troubleshooting info:', data.troubleshooting);
          toast({
            variant: "destructive",
            title: "Teams Meeting Configuration Error",
            description: data.helpMessage || "Please check your Microsoft Graph API configuration.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Teams Meeting Error",
            description: "Unable to create Teams meeting. The regular meeting will still be saved.",
          });
        }
        return null;
      }
    } catch (error: any) {
      console.error('Error in createTeamsLink:', error);
      toast({
        variant: "destructive",
        title: "Teams Meeting Error",
        description: "An unexpected error occurred. The regular meeting will still be saved.",
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
          description: "Please log in to create a meeting.",
        });
        return;
      }

      let teamsLink = null;
      
      // Automatically create Teams link for online meetings
      if (formData.location === 'Online') {
        teamsLink = await createTeamsLink();
        if (teamsLink) {
          toast({
            title: "Teams meeting created",
            description: "Microsoft Teams meeting link has been generated!",
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
        created_by: user.id
      };

      console.log('Submitting meeting data:', meetingData);

      const { data: insertedData, error } = await supabase
        .from('meetings')
        .insert(meetingData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating meeting:', error);
        throw error;
      }

      setCreatedMeetingId(insertedData.id);

      toast({
        title: "Meeting created successfully",
        description: teamsLink 
          ? "Meeting has been scheduled and Teams link has been generated!" 
          : "Meeting has been scheduled successfully!",
      });

      // Don't call onSuccess yet, let user decide if they want to link to deals
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast({
        variant: "destructive",
        title: "Error creating meeting",
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
              <Select value={formData.duration} onValueChange={(value: '30 min' | '1 hour') => handleInputChange('duration', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 min">30 minutes</SelectItem>
                  <SelectItem value="1 hour">1 hour</SelectItem>
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

            {/* Participants moved here as requested */}
            <div>
              <Label>Participants</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    placeholder="Enter email address"
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description at the bottom as requested */}
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
      <div className="flex justify-between items-center pt-4">
        <div>
          {createdMeetingId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleLinkToDeals}
              disabled={isLinkingToDeal}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              {isLinkingToDeal ? 'Linking to Deal...' : 'Link to Deals Pipeline'}
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          {!createdMeetingId ? (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Meeting'}
            </Button>
          ) : (
            <Button type="button" onClick={onSuccess}>
              Done
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default AddMeetingForm;
