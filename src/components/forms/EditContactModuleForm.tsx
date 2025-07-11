
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ContactFormSections } from './ContactFormSections';
import { Contact } from '@/types/contact';

const formSchema = z.object({
  contact_name: z.string().min(1, 'Contact name is required'),
  company_name: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone_no: z.string().optional(),
  mobile_no: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  contact_source: z.string().optional(),
  lead_status: z.string().optional(),
  industry: z.string().optional(),
  no_of_employees: z.number().optional(),
  annual_revenue: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  contact_owner: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditContactModuleFormProps {
  contact: Contact;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditContactModuleForm = ({ contact, onSuccess, onCancel }: EditContactModuleFormProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { displayName } = useUserProfile();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact_name: contact.contact_name || '',
      company_name: contact.company_name || '',
      position: contact.position || '',
      email: contact.email || '',
      phone_no: contact.phone_no || '',
      mobile_no: contact.mobile_no || '',
      linkedin: contact.linkedin || '',
      website: contact.website || '',
      contact_source: contact.contact_source || 'Website',
      lead_status: contact.lead_status || 'New',
      industry: contact.industry || 'Technology',
      no_of_employees: contact.no_of_employees || undefined,
      annual_revenue: contact.annual_revenue || undefined,
      city: contact.city || '',
      state: contact.state || '',
      country: contact.country || '',
      description: contact.description || '',
      contact_owner: displayName,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to update contacts.",
      });
      return;
    }

    setLoading(true);
    try {
      // Handle "Other" selection - use default enum values for database storage
      const finalContactSource = data.contact_source === 'Other' ? 'Website' : (data.contact_source || 'Website');
      const finalIndustry = data.industry === 'Other' ? 'Technology' : (data.industry || 'Technology');
      
      const contactData = {
        contact_name: data.contact_name,
        company_name: data.company_name || null,
        position: data.position || null,
        email: data.email || null,
        phone_no: data.phone_no || null,
        mobile_no: data.mobile_no || null,
        linkedin: data.linkedin || null,
        website: data.website || null,
        contact_source: finalContactSource as any,
        lead_status: (data.lead_status || 'New') as any,
        industry: finalIndustry as any,
        no_of_employees: data.no_of_employees || null,
        annual_revenue: data.annual_revenue || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        description: data.description || null,
        contact_owner: user.id,
        modified_by: user.id,
      };

      const { error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', contact.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Contact updated successfully!",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Edit contact error:', error);
      toast({
        variant: "destructive",
        title: "Error updating contact",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ContactFormSections control={form.control as any} />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Contact'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditContactModuleForm;
