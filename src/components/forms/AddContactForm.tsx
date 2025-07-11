
import { useState } from 'react';
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
import { useUserProfile } from '@/hooks/useUserProfile';

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
  custom_contact_source: z.string().optional(),
  industry: z.string().optional(),
  custom_industry: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddContactFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddContactForm = ({ onSuccess, onCancel }: AddContactFormProps) => {
  const [loading, setLoading] = useState(false);
  const [showCustomSource, setShowCustomSource] = useState(false);
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const { user } = useAuth();
  const { displayName, loading: profileLoading } = useUserProfile();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact_name: '',
      company_name: '',
      position: '',
      email: '',
      phone_no: '',
      mobile_no: '',
      linkedin: '',
      website: '',
      contact_source: 'Website',
      custom_contact_source: '',
      industry: 'Technology',
      custom_industry: '',
      city: '',
      country: '',
      description: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to create contacts.",
      });
      return;
    }

    setLoading(true);
    try {
      // Use custom values if "Other" was selected
      const finalContactSource = data.contact_source === 'Other' 
        ? data.custom_contact_source || data.contact_source
        : data.contact_source;
      
      const finalIndustry = data.industry === 'Other' 
        ? data.custom_industry || data.industry
        : data.industry;

      const { error } = await supabase
        .from('contacts')
        .insert([{
          contact_name: data.contact_name,
          company_name: data.company_name || null,
          position: data.position || null,
          email: data.email || null,
          phone_no: data.phone_no || null,
          mobile_no: data.mobile_no || null,
          linkedin: data.linkedin || null,
          website: data.website || null,
          contact_source: finalContactSource as any,
          industry: finalIndustry as any,
          city: data.city || null,
          country: data.country || null, 
          description: data.description || null,
          created_by: user.id,
          contact_owner: user.id,
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Contact created successfully!",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating contact",
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
            name="contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Name *</FormLabel>
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
                <FormLabel>Company Name</FormLabel>
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

          <div className="col-span-2">
            <FormLabel>Contact Owner</FormLabel>
            <Input 
              value={profileLoading ? 'Loading...' : displayName || user?.email || 'Not logged in'} 
              readOnly 
              className="bg-muted"
            />
          </div>

          <FormField
            control={form.control}
            name="phone_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
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
                <FormLabel>Mobile Number</FormLabel>
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
                <FormLabel>LinkedIn Profile</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://linkedin.com/in/username" />
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
                  <Input {...field} placeholder="https://example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Source</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setShowCustomSource(value === 'Other');
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Advertisement">Advertisement</SelectItem>
                    <SelectItem value="Trade Show">Trade Show</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showCustomSource && (
            <FormField
              control={form.control}
              name="custom_contact_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Contact Source</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter custom source" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setShowCustomIndustry(value === 'Other');
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Automotive">Automotive</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showCustomIndustry && (
            <FormField
              control={form.control}
              name="custom_industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Industry</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter custom industry" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
            {loading ? 'Creating...' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddContactForm;
