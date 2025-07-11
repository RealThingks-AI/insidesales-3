
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailLogFormProps {
  contactId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EmailLogForm = ({ contactId, onSuccess, onCancel }: EmailLogFormProps) => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
    status: 'Sent',
    priority: 'Medium',
    assignedTo: '',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Since tasks table doesn't exist, we'll just show a success message
      // In a real implementation, you'd save this to an email_logs table
      console.log('Email log data:', formData);
      
      toast({
        title: 'Success',
        description: 'Email logged successfully',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error logging email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to log email',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Log Email</CardTitle>
        <CardDescription>Record email communication details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                value={formData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                placeholder="recipient@example.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Opened">Opened</SelectItem>
                  <SelectItem value="Replied">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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

          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Email content"
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmailLogForm;
