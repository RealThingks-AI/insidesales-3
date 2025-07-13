import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  lead_status: z.string().min(1, 'Lead status is required'),
});

type FormData = z.infer<typeof formSchema>;

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
  contact_source: string;
  lead_status: string;
  industry: string;
  no_of_employees: number;
  annual_revenue: number;
  city: string;
  state: string;
  country: string;
  description: string;
  contact_owner: string;
}

interface ConvertToLeadFormProps {
  contact: Contact;
  onSuccess: () => void;
  onCancel: () => void;
}

const ConvertToLeadForm = ({ contact, onSuccess, onCancel }: ConvertToLeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lead_status: 'Contacted',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to convert contacts.",
      });
      return;
    }

    setLoading(true);
    try {
      if (data.lead_status === 'Lost') {
        // Mark contact as non-convertible
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ 
            lead_status: 'Lost',
            modified_by: user.id,
            modified_time: new Date().toISOString()
          })
          .eq('id', contact.id);

        if (updateError) throw updateError;

        toast({
          title: "Status Updated",
          description: "Contact marked as Lost and will not be converted to a lead.",
        });
      } else if (data.lead_status === 'Contacted') {
        // Convert contact to lead
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .insert({
            lead_name: contact.contact_name,
            company_name: contact.company_name,
            position: contact.position,
            email: contact.email,
            phone_no: contact.phone_no,
            mobile_no: contact.mobile_no,
            linkedin: contact.linkedin,
            website: contact.website,
            contact_source: contact.contact_source || 'Website',
            lead_status: data.lead_status,
            industry: contact.industry || 'Other',
            city: contact.city,
            country: contact.country,
            description: contact.description,
            contact_owner: contact.contact_owner,
            created_by: user.id,
          } as any)
          .select()
          .single();

        if (leadError) throw leadError;

        toast({
          title: "Success",
          description: "Contact converted to lead successfully!",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error processing contact:', error);
      toast({
        variant: "destructive",
        title: "Error processing contact",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="lead_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Processing...' : form.watch('lead_status') === 'Lost' ? 'Mark as Lost' : 'Convert to Lead'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ConvertToLeadForm;