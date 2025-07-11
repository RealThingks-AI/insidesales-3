
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  lead_name: z.string().min(1, 'Lead name is required'),
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
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  lead_owner: z.string().optional(),
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
  fax: string;
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
  const [userProfile, setUserProfile] = useState<string>('');
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lead_name: contact.contact_name || '',
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
      city: contact.city || '',
      country: contact.country || '',
      description: contact.description || '',
      lead_owner: '',
    },
  });

  // Fetch user profile to get display name
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile && !error) {
          const displayName = profile.full_name || 'Current User';
          setUserProfile(displayName);
          form.setValue('lead_owner', displayName);
        }
      }
    };

    fetchUserProfile();
  }, [user, form]);

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
      // Check which table the contact exists in
      let contactTable = 'contacts';
      let actualContactId = contact.id;

      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contact.id)
        .single();

      if (contactsError) {
        // Contact is in contacts_module table, need to create a record in contacts table
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
            created_by: user.id,
          })
          .select()
          .single();

        if (createContactError) throw createContactError;
        actualContactId = newContact.id;
        contactTable = 'contacts_module';
        console.log('Created corresponding contact record for foreign key:', newContact.id);
      }

      // Create lead in leads table with all transferred fields
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          lead_name: data.lead_name,
          company_name: data.company_name || null,
          position: data.position || null,
          email: data.email || null,
          phone_no: data.phone_no || null,
          mobile_no: data.mobile_no || null,
          linkedin: data.linkedin || null,
          website: data.website || null,
          contact_source: data.contact_source as any,
          lead_status: data.lead_status as any,
          industry: data.industry as any,
          city: data.city || null,
          country: data.country || null,
          description: data.description || null,
          contact_owner: user.id,
          created_by: user.id,
          modified_by: user.id,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Log the conversion in lead_conversions table using the actual contact ID
      const { error: conversionError } = await supabase
        .from('lead_conversions')
        .insert({
          contact_id: actualContactId, // This references the contacts table
          lead_id: leadData.id,
          converted_by: user.id,
          conversion_notes: `Converted from contact: ${contact.contact_name}. Original contact table: ${contactTable}. All available fields transferred including: ${Object.keys(data).filter(key => data[key as keyof FormData]).join(', ')}`,
        });

      if (conversionError) throw conversionError;

      toast({
        title: "Success",
        description: "Contact converted to lead successfully with all fields transferred!",
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error converting contact:', error);
      toast({
        variant: "destructive",
        title: "Error converting contact",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lead_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lead_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Automotive">Automotive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lead_owner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Owner</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            {loading ? 'Converting...' : 'Convert to Lead'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ConvertToLeadForm;
