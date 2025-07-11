
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Calendar, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface LeadsTableActionsProps {
  lead: {
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
  onEditLead: (lead: any) => void;
  onDeleteLead: (leadId: string) => void;
}

const LeadsTableActions = ({ 
  lead, 
  onEditLead, 
  onDeleteLead 
}: LeadsTableActionsProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScheduleMeeting = () => {
    // Navigate to meetings page with lead info in state
    navigate('/meetings', { 
      state: { 
        openAddForm: true, 
        leadData: lead 
      } 
    });
  };

  const handleConvertToContact = async () => {
    setLoading(true);
    try {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          contact_name: lead.contact_name,
          email: lead.email,
          company_name: lead.company_name,
          position: lead.position,
          phone_no: lead.phone_no,
          mobile_no: lead.mobile_no,
          linkedin: lead.linkedin,
          website: lead.website,
          contact_source: lead.contact_source as any,
          industry: lead.industry as any,
          no_of_employees: lead.no_of_employees,
          annual_revenue: lead.annual_revenue,
          city: lead.city,
          state: lead.state,
          country: lead.country,
          description: lead.description,
          lead_status: 'New',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead converted to contact successfully",
      });

      // Navigate to the contacts page
      navigate('/contacts');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error converting lead to contact",
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
        <DropdownMenuItem onClick={handleScheduleMeeting}>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Meeting
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleConvertToContact} disabled={loading}>
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? 'Converting...' : 'Convert to Contact'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEditLead(lead)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Lead
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDeleteLead(lead.id)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Lead
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LeadsTableActions;
