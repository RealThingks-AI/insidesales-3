
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflow } from '@/hooks/useWorkflow';
import { Mail, UserPlus, HandCoins, Calendar, ArrowRight } from 'lucide-react';

interface WorkflowActionsProps {
  contactId?: string;
  leadId?: string;
  currentStage?: string;
  contactData?: any;
  leadData?: any;
}

const WorkflowActions = ({ contactId, leadId, currentStage, contactData, leadData }: WorkflowActionsProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertData, setConvertData] = useState<any>({});

  const { 
    loading, 
    updateContactWorkflowStage, 
    convertContactToLead, 
    convertLeadToDeal, 
    sendEmailFromTemplate 
  } = useWorkflow();

  const workflowStages = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'interested', label: 'Interested', color: 'bg-green-100 text-green-800' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-purple-100 text-purple-800' },
    { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800' },
  ];

  const emailTemplates = [
    { id: 'welcome', name: 'Welcome Email', type: 'welcome' },
    { id: 'follow_up', name: 'Follow Up Email', type: 'follow_up' },
    { id: 'meeting_invite', name: 'Meeting Invitation', type: 'meeting_invite' },
  ];

  const handleStageUpdate = async (newStage: string) => {
    if (contactId) {
      await updateContactWorkflowStage(contactId, newStage);
    }
  };

  const handleSendEmail = async () => {
    if (contactId && selectedTemplate) {
      await sendEmailFromTemplate(contactId, selectedTemplate, {
        subject: emailSubject,
        body: emailBody,
      });
      setShowEmailDialog(false);
      setSelectedTemplate('');
      setEmailSubject('');
      setEmailBody('');
    }
  };

  const handleConvertToLead = async () => {
    if (contactId) {
      const leadData = {
        contact_name: `Contact ${contactId.substring(0, 8)}`,
        company_name: convertData.company,
        lead_status: 'New',
        contact_source: convertData.lead_source || 'Contact Conversion',
      };
      await convertContactToLead(contactId, leadData);
      setShowConvertDialog(false);
      setConvertData({});
    }
  };

  const handleConvertToDeal = async () => {
    if (leadId) {
      const dealData = {
        deal_name: convertData.deal_name,
        amount: parseFloat(convertData.amount || '0'),
        stage: 'Qualification',
        probability: parseInt(convertData.probability || '0'),
        closing_date: convertData.closing_date,
      };
      await convertLeadToDeal(leadId, dealData);
      setShowConvertDialog(false);
      setConvertData({});
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ArrowRight className="h-5 w-5 mr-2" />
          Workflow Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Stage */}
        {currentStage && (
          <div className="mb-4">
            <Label>Current Stage</Label>
            <div className="mt-1">
              <Badge className={workflowStages.find(s => s.value === currentStage)?.color || 'bg-gray-100 text-gray-800'}>
                {workflowStages.find(s => s.value === currentStage)?.label || currentStage}
              </Badge>
            </div>
          </div>
        )}

        {/* Stage Progression */}
        {contactId && (
          <div>
            <Label>Update Stage</Label>
            <Select onValueChange={handleStageUpdate} disabled={loading}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select new stage" />
              </SelectTrigger>
              <SelectContent>
                {workflowStages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {/* Send Email */}
          <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject (optional override)</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Custom subject"
                  />
                </div>
                <div>
                  <Label>Body (optional override)</Label>
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Custom email body"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendEmail} disabled={!selectedTemplate || loading}>
                    Send Email
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Convert Actions */}
          {contactId && (
            <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convert to Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convert to Lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={convertData.company || ''}
                      onChange={(e) => setConvertData({ ...convertData, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label>Lead Source</Label>
                    <Input
                      value={convertData.lead_source || ''}
                      onChange={(e) => setConvertData({ ...convertData, lead_source: e.target.value })}
                      placeholder="Lead source"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConvertToLead} disabled={loading}>
                      Convert to Lead
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {leadId && (
            <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <HandCoins className="h-4 w-4 mr-2" />
                  Convert to Deal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convert to Deal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Deal Name</Label>
                    <Input
                      value={convertData.deal_name || ''}
                      onChange={(e) => setConvertData({ ...convertData, deal_name: e.target.value })}
                      placeholder="Deal name"
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={convertData.amount || ''}
                      onChange={(e) => setConvertData({ ...convertData, amount: e.target.value })}
                      placeholder="Deal amount"
                    />
                  </div>
                  <div>
                    <Label>Probability (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={convertData.probability || ''}
                      onChange={(e) => setConvertData({ ...convertData, probability: e.target.value })}
                      placeholder="Probability"
                    />
                  </div>
                  <div>
                    <Label>Expected Closing Date</Label>
                    <Input
                      type="date"
                      value={convertData.closing_date || ''}
                      onChange={(e) => setConvertData({ ...convertData, closing_date: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConvertToDeal} disabled={loading}>
                      Convert to Deal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowActions;
