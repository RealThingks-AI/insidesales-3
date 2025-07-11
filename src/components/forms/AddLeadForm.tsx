
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Lead {
  id: string;
  lead_name: string;
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
  city: string;
  country: string;
  description: string;
  contact_owner?: string;
}

interface AddLeadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Lead;
  isEditing?: boolean;
  leadId?: string;
}

// Updated types to match database schema exactly
type ContactSource = 'Website' | 'Email' | 'Phone' | 'Referral' | 'Social Media' | 'Advertisement' | 'Trade Show' | 'Other';
type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost';
type Industry = 'Technology' | 'Healthcare' | 'Finance' | 'Education' | 'Manufacturing' | 'Retail' | 'Automotive' | 'Real Estate' | 'Other';

const AddLeadForm = ({ onSuccess, onCancel, initialData, isEditing = false, leadId }: AddLeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<string>('');
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    lead_name: initialData?.lead_name || '',
    company_name: initialData?.company_name || '',
    position: initialData?.position || '',
    email: initialData?.email || '',
    phone_no: initialData?.phone_no || '',
    mobile_no: initialData?.mobile_no || '',
    linkedin: initialData?.linkedin || '',
    website: initialData?.website || '',
    contact_source: (initialData?.contact_source as ContactSource) || 'Website' as ContactSource,
    lead_status: (initialData?.lead_status as LeadStatus) || 'New' as LeadStatus,
    industry: (initialData?.industry as Industry) || 'Technology' as Industry,
    city: initialData?.city || '',
    country: initialData?.country || '',
    description: initialData?.description || '',
    lead_owner: '',
  });

  // Fetch user profile and set lead owner
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
          
          if (isEditing && initialData?.contact_owner) {
            // For editing, fetch the existing owner's name
            const { data: ownerProfile, error: ownerError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', initialData.contact_owner)
              .single();
            
            if (ownerProfile && !ownerError) {
              setFormData(prev => ({ ...prev, lead_owner: ownerProfile.full_name || 'Unknown User' }));
            }
          } else {
            // For new leads, use current user
            setFormData(prev => ({ ...prev, lead_owner: displayName }));
          }
        }
      }
    };

    fetchUserProfile();
  }, [user, isEditing, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lead_name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Lead name is required",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const leadData = {
        lead_name: formData.lead_name,
        company_name: formData.company_name,
        position: formData.position,
        email: formData.email,
        phone_no: formData.phone_no,
        mobile_no: formData.mobile_no,
        linkedin: formData.linkedin,
        website: formData.website,
        contact_source: formData.contact_source,
        lead_status: formData.lead_status,
        industry: formData.industry,
        city: formData.city,
        country: formData.country,
        description: formData.description,
        contact_owner: isEditing ? (initialData?.contact_owner || userId) : userId,
        ...(isEditing ? { modified_by: userId } : { created_by: userId }),
      };

      if (isEditing && leadId) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', leadId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('leads')
          .insert(leadData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Error saving lead:', error);
      toast({
        variant: "destructive",
        title: `Error ${isEditing ? 'updating' : 'creating'} lead`,
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lead_name">Lead Name *</Label>
            <Input
              id="lead_name"
              value={formData.lead_name}
              onChange={(e) => handleChange('lead_name', e.target.value)}
              placeholder="Enter lead name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Enter company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead_status">Lead Status *</Label>
            <Select value={formData.lead_status} onValueChange={(value) => handleChange('lead_status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder="Enter position"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone_no">Phone Number</Label>
            <Input
              id="phone_no"
              value={formData.phone_no}
              onChange={(e) => handleChange('phone_no', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile_no">Mobile Number</Label>
            <Input
              id="mobile_no"
              value={formData.mobile_no}
              onChange={(e) => handleChange('mobile_no', e.target.value)}
              placeholder="Enter mobile number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile</Label>
            <Input
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_source">Contact Source</Label>
            <Select value={formData.contact_source} onValueChange={(value) => handleChange('contact_source', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Advertisement">Advertisement</SelectItem>
                <SelectItem value="Trade Show">Trade Show</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={formData.industry} onValueChange={(value) => handleChange('industry', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Automotive">Automotive</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lead_owner">Lead Owner</Label>
            <Input
              id="lead_owner"
              value={formData.lead_owner}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Enter city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Enter country"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          placeholder="Enter lead description..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Lead' : 'Create Lead')}
        </Button>
      </div>
    </form>
  );
};

export default AddLeadForm;
