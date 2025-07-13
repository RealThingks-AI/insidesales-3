
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, ArrowRight, Building, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  contact_name: string;
  company_name: string;
  position: string;
  email: string;
  phone_no: string;
  mobile_no: string;
  linkedin: string;
  
  website: string;
  contact_owner: string;
  contact_source: string;
  industry: string;
  created_by: string;
  modified_by: string;
  created_time: string;
  modified_time: string;
  city: string;
  country: string;
  description: string;
}

interface ContactDetailsProps {
  contactId: string;
  onClose: () => void;
}

const ContactDetails = ({ contactId, onClose }: ContactDetailsProps) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactDetails();
  }, [contactId]);

  const fetchContactDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      setContact(data);
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

  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Contact not found</p>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {contact.contact_name || `Contact ${contact.id.substring(0, 8)}`}
          </h1>
          <p className="text-gray-600">{contact.company_name}</p>
          {contact.position && <p className="text-sm text-gray-500">{contact.position}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {contact.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone_no && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{contact.phone_no}</span>
                  </div>
                )}
                {contact.mobile_no && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{contact.mobile_no} (Mobile)</span>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contact.website}
                    </a>
                  </div>
                )}
                {contact.linkedin && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {(contact.city || contact.country) && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {[contact.city, contact.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Industry:</span>
                  <p className="font-medium">{contact.industry || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Source:</span>
                  <p className="font-medium">{contact.contact_source || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
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

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Created: {new Date(contact.created_time).toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Modified: {new Date(contact.modified_time).toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">ID: {contact.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & History */}
        <div className="space-y-6">
          {/* Activity Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="h-5 w-5 mr-2" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">No activity recorded yet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactDetails;
