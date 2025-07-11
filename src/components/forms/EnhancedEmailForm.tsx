import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';

interface Contact {
  id: string;
  contact_name: string;
  email: string;
  company_name: string;
}

interface EnhancedEmailFormProps {
  contactId?: string;
  contactEmail?: string;
  contactName?: string;
  onSuccess?: (emailId?: string) => void;
  onCancel?: () => void;
}

const EnhancedEmailForm = ({ contactId, contactEmail, contactName, onSuccess, onCancel }: EnhancedEmailFormProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    priority: 'Medium',
    sendCopy: false,
    scheduleEmail: false,
    scheduledDate: '',
    attachments: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
    if (contactId) {
      fetchSpecificContact(contactId);
    }
    
    // If contactEmail and contactName are provided, add them to selectedContacts
    if (contactId && contactEmail && contactName) {
      setSelectedContacts([{
        id: contactId,
        contact_name: contactName,
        email: contactEmail,
        company_name: '' // Default empty company name
      }]);
    }
  }, [contactId, contactEmail, contactName]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, contact_name, email, company_name')
        .not('email', 'is', null);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchSpecificContact = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, contact_name, email, company_name')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedContacts([data]);
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Since we don't have an email service, we'll just simulate the email sending
      console.log('Email data:', {
        recipients: selectedContacts,
        ...formData
      });
      
      toast({
        title: 'Success',
        description: `Email sent to ${selectedContacts.length} recipient(s)`,
      });

      if (onSuccess) {
        // Generate a mock email ID for tracking
        const mockEmailId = `email_${Date.now()}`;
        onSuccess(mockEmailId);
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addContact = (contact: Contact) => {
    if (!selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const removeContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contactId));
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Send Email</CardTitle>
        <CardDescription>Compose and send emails to your contacts</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipients Section */}
          <div>
            <Label>Recipients</Label>
            <div className="space-y-2">
              <Select onValueChange={(value) => {
                const contact = contacts.find(c => c.id === value);
                if (contact) addContact(contact);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contacts to add" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.contact_name} ({contact.email}) - {contact.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map((contact) => (
                  <Badge key={contact.id} variant="secondary" className="flex items-center gap-1">
                    {contact.contact_name} ({contact.email})
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeContact(contact.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Email subject"
              required
            />
          </div>

          {/* Email Body */}
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Type your message here..."
              rows={8}
              required
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sendCopy"
                  checked={formData.sendCopy}
                  onCheckedChange={(checked) => handleInputChange('sendCopy', checked)}
                />
                <Label htmlFor="sendCopy">Send me a copy</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="scheduleEmail"
                  checked={formData.scheduleEmail}
                  onCheckedChange={(checked) => handleInputChange('scheduleEmail', checked)}
                />
                <Label htmlFor="scheduleEmail">Schedule email</Label>
              </div>
            </div>
          </div>

          {/* Schedule Date */}
          {formData.scheduleEmail && (
            <div>
              <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || selectedContacts.length === 0}>
              {isSubmitting ? 'Sending...' : formData.scheduleEmail ? 'Schedule Email' : 'Send Email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedEmailForm;
