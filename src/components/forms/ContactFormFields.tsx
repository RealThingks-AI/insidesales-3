
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Control } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface ContactFormData {
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  mobile_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  custom_contact_source?: string;
  industry?: string;
  custom_industry?: string;
  city?: string;
  country?: string;
  description?: string;
  contact_owner?: string;
}

interface ContactFormFieldsProps {
  control: Control<ContactFormData>;
}

export const BasicInfoFields = ({ control }: ContactFormFieldsProps) => {
  const { user } = useAuth();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
        name="contact_owner"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Owner</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || user?.email || ''} className="bg-gray-50" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export const ContactInfoFields = ({ control }: ContactFormFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={control}
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
      control={control}
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
      control={control}
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
      control={control}
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
  </div>
);

export const BusinessInfoFields = ({ control }: ContactFormFieldsProps) => {
  const [showCustomSource, setShowCustomSource] = useState(false);
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name="contact_source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Source</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                setShowCustomSource(value === 'Other');
              }} 
              value={field.value || 'Website'}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact source" />
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
          control={control}
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
        control={control}
        name="industry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Industry</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                setShowCustomIndustry(value === 'Other');
              }} 
              value={field.value || 'Technology'}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
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
          control={control}
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
    </div>
  );
};

export const LocationFields = ({ control }: ContactFormFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={control}
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
      control={control}
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
);
