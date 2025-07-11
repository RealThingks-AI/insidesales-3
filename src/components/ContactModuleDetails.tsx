import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Phone, Building, Calendar, UserPlus, Send, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnhancedEmailForm from '@/components/forms/EnhancedEmailForm';
import EmailResponseActions from '@/components/EmailResponseActions';
import ConvertToLeadForm from '@/components/forms/ConvertToLeadForm';
import { Contact } from '@/types/contact';

interface ContactModuleDetailsProps {
  contactId: string;
  onClose: () => void;
}

const ContactModuleDetails = ({ contactId, onClose }: ContactModuleDetailsProps) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [showResponseActions, setShowResponseActions] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  useEffect(() => {
    fetchContactDetails();
  }, [contactId]);

  const fetchContactDetails = async () => {
    try {
      // Query unified contacts table
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      
      if (data) {
        // The data already matches our Contact interface since it's from the contacts table
        setContact(data as Contact);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching contact details",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEmailSent = (emailId?: string) => {
    setShowEmailForm(false);
    if (emailId) {
      setSelectedEmailId(emailId);
      setShowResponseActions(true);
    }
  };

  const handleResponseActionComplete = () => {
    setShowResponseActions(false);
    setSelectedEmailId(null);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!contact) {
    return <div className="p-6">Contact not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{contact.contact_name}</h2>
          <p className="text-gray-600">{contact.position} at {contact.company_name}</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowEmailForm(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button onClick={() => setShowConvertForm(true)} variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Convert to Lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Contact Details</TabsTrigger>
          <TabsTrigger value="emails">Email History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{contact.email || 'No email'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{contact.phone_no || 'No phone'}</span>
                </div>
                {contact.mobile_no && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{contact.mobile_no} (Mobile)</span>
                  </div>
                )}
                {contact.linkedin && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">LinkedIn: {contact.linkedin}</span>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">Website: {contact.website}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Industry: </span>
                  <Badge variant="outline">{contact.industry}</Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Lead Status: </span>
                  <Badge className={getStatusColor(contact.lead_status || '')}>
                    {contact.lead_status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Source: </span>
                  <span>{contact.contact_source}</span>
                </div>
                {contact.no_of_employees && (
                  <div>
                    <span className="text-sm text-gray-600">Employees: </span>
                    <span>{contact.no_of_employees}</span>
                  </div>
                )}
                {contact.annual_revenue && (
                  <div>
                    <span className="text-sm text-gray-600">Annual Revenue: </span>
                    <span>${contact.annual_revenue.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {(contact.city || contact.state || contact.country) && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}</p>
                </CardContent>
              </Card>
            )}

            {contact.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{contact.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Email History</h3>
            <Button onClick={() => setShowEmailForm(true)} size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emails sent yet</h3>
              <p className="text-gray-600 mb-4">Start engaging with this contact by sending an email.</p>
              <Button onClick={() => setShowEmailForm(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send First Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Email Form Dialog */}
      <Dialog open={showEmailForm} onOpenChange={setShowEmailForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Send Email to {contact.contact_name}</DialogTitle>
          </DialogHeader>
          <EnhancedEmailForm
            contactId={contactId}
            contactEmail={contact.email || ''}
            contactName={contact.contact_name || ''}
            onSuccess={handleEmailSent}
            onCancel={() => setShowEmailForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Email Response Actions Dialog */}
      <Dialog open={showResponseActions} onOpenChange={setShowResponseActions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Track Email Response</DialogTitle>
          </DialogHeader>
          {selectedEmailId && (
            <EmailResponseActions
              emailId={selectedEmailId}
              contactId={contactId}
              contactName={contact.contact_name}
              onActionComplete={handleResponseActionComplete}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Lead Dialog */}
      <Dialog open={showConvertForm} onOpenChange={setShowConvertForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Convert {contact.contact_name} to Lead</DialogTitle>
          </DialogHeader>
          <ConvertToLeadForm
            contact={contact}
            onSuccess={() => {
              setShowConvertForm(false);
              toast({
                title: "Success",
                description: "Contact converted to lead successfully!",
              });
            }}
            onCancel={() => setShowConvertForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactModuleDetails;
