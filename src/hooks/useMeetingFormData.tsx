import { useState, useEffect } from 'react';
import { getUserTimezone } from '@/utils/timezones';

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

export const useMeetingFormData = (
  meeting: Meeting | null | undefined,
  initialLeadData?: any
) => {
  const [formData, setFormData] = useState({
    meeting_title: '',
    date: '',
    start_time: '',
    duration: '30 min' as '30 min' | '1 hour',
    location: 'Online' as 'Online' | 'In-Person',
    timezone: getUserTimezone(),
    participants: [] as string[],
    teams_link: '',
    description: ''
  });

  useEffect(() => {
    if (meeting) {
      setFormData({
        meeting_title: meeting.meeting_title || '',
        date: meeting.date || '',
        start_time: meeting.start_time || '',
        duration: (meeting.duration === '15 min' || meeting.duration === '2 hours') ? '1 hour' : meeting.duration as '30 min' | '1 hour',
        location: meeting.location || 'Online',
        timezone: meeting.timezone || getUserTimezone(),
        participants: meeting.participants || [],
        teams_link: meeting.teams_link || '',
        description: meeting.description || ''
      });
    } else if (initialLeadData) {
      setFormData(prev => ({
        ...prev,
        meeting_title: `Meeting with ${initialLeadData.lead_name}`,
        participants: initialLeadData.email ? [initialLeadData.email] : []
      }));
    }
  }, [meeting, initialLeadData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  return {
    formData,
    handleInputChange,
    getCurrentDateTime,
    isDateTimeInPast
  };
};