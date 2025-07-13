
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ContactsTableActionsProps {
  contact: {
    id: string;
    contact_name: string;
    email: string;
    company_name?: string;
    position?: string;
    phone_no?: string;
    mobile_no?: string;
    linkedin?: string;
    website?: string;
    contact_source?: string;
    industry?: string;
    no_of_employees?: number;
    annual_revenue?: number;
    city?: string;
    state?: string;
    country?: string;
    description?: string;
  };
  onEditContact: (contact: any) => void;
  onDeleteContact: (contactId: string) => void;
}

const ContactsTableActions = ({ 
  contact, 
  onEditContact, 
  onDeleteContact 
}: ContactsTableActionsProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConvertToLead = async () => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "You must be logged in to convert contacts.",
        });
        return;
      }

      // Check which table the contact exists in and handle accordingly
      let actualContactId = contact.id;
      
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contact.id)
        .single();

      if (contactsError) {
        // Contact is in contacts_module, need to create corresponding record in contacts table
        const { data: newContact, error: createContactError } = await supabase
          .from('contacts')
          .insert({
            contact_name: contact.contact_name,
            company_name: contact.company_name,
            position: contact.position,
            email: contact.email,
            phone_no: contact.phone_no,
            mobile_no: contact.mobile_no,
            linkedin: contact.linkedin,
            website: contact.website,
            contact_source: contact.contact_source as any,
            industry: contact.industry as any,
            city: contact.city,
            country: contact.country,
            description: contact.description,
            created_by: user.data.user.id,
          })
          .select()
          .single();

        if (createContactError) throw createContactError;
        actualContactId = newContact.id;
        console.log('Created corresponding contact record:', newContact.id);
      }

      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          lead_name: contact.contact_name,
          email: contact.email,
          company_name: contact.company_name,
          position: contact.position,
          phone_no: contact.phone_no,
          mobile_no: contact.mobile_no,
          linkedin: contact.linkedin,
          website: contact.website,
          contact_source: contact.contact_source as any,
          industry: contact.industry as any,
          no_of_employees: contact.no_of_employees,
          annual_revenue: contact.annual_revenue,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          description: contact.description,
          lead_status: 'New',
          created_by: user.data.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Lead conversion successful - no need for legacy conversion tracking

      toast({
        title: "Success",
        description: "Contact converted to lead successfully",
      });

      // Navigate to the new lead
      navigate('/leads');
    } catch (error: any) {
      console.error('Error converting contact to lead:', error);
      toast({
        variant: "destructive",
        title: "Error converting contact to lead",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleConvertToLead} disabled={loading}>
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? 'Converting...' : 'Convert to Lead'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEditContact(contact)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Contact
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDeleteContact(contact.id)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Contact
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContactsTableActions;
