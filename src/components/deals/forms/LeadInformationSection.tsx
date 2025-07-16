import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Building, User, Users } from 'lucide-react';

interface LeadInformationSectionProps {
  dealId: string;
  relatedLeadId?: string;
}

export const LeadInformationSection = ({ dealId, relatedLeadId }: LeadInformationSectionProps) => {
  const [leadInfo, setLeadInfo] = useState<{
    company_name?: string;
    lead_name?: string;
    lead_owner?: string;
    email?: string;
    phone_no?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeadInfo = async () => {
      if (!relatedLeadId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch lead information
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('lead_name, company_name, contact_owner, email, phone_no')
          .eq('id', relatedLeadId)
          .single();

        if (leadError) {
          console.error('Error fetching lead:', leadError);
          setLoading(false);
          return;
        }

        // Fetch lead owner profile if contact_owner exists
        let leadOwnerName = '';
        if (lead.contact_owner) {
          try {
            // First try to get display name via edge function
            const { data: userDisplayData, error: displayError } = await supabase.functions.invoke('get-user-display-names', {
              body: { userIds: [lead.contact_owner] }
            });

            if (!displayError && userDisplayData?.userDisplayNames?.[lead.contact_owner]) {
              leadOwnerName = userDisplayData.userDisplayNames[lead.contact_owner];
            } else {
              // Fallback to direct profile query
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, "Email ID"')
                .eq('id', lead.contact_owner)
                .single();

              if (!profileError && profile) {
                // Create a proper display name
                if (profile.full_name && profile.full_name !== profile["Email ID"]) {
                  leadOwnerName = profile.full_name;
                } else if (profile["Email ID"]) {
                  // Extract name from email (part before @)
                  leadOwnerName = profile["Email ID"].split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
              }
            }
          } catch (error) {
            console.error('Error fetching lead owner name:', error);
          }
        }

        setLeadInfo({
          company_name: lead.company_name,
          lead_name: lead.lead_name,
          lead_owner: leadOwnerName,
          email: lead.email,
          phone_no: lead.phone_no,
        });
      } catch (error) {
        console.error('Error in fetchLeadInfo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadInfo();
  }, [relatedLeadId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="h-4 w-4" />
            Lead Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!relatedLeadId || !leadInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="h-4 w-4" />
            Lead Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No lead linked to this deal</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Building className="h-4 w-4" />
          Lead Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Company Name</Label>
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3 text-gray-500" />
              <Input
                value={leadInfo.company_name || 'No Company'}
                readOnly
                className="bg-gray-50 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Lead Name</Label>
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-500" />
              <Input
                value={leadInfo.lead_name || 'No Lead Name'}
                readOnly
                className="bg-gray-50 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Lead Owner</Label>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-gray-500" />
               <Input
                 value={leadInfo.lead_owner || 'Unknown Owner'}
                readOnly
                className="bg-gray-50 text-sm"
              />
            </div>
          </div>


          {leadInfo.phone_no && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Phone</Label>
              <Input
                value={leadInfo.phone_no}
                readOnly
                className="bg-gray-50 text-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};