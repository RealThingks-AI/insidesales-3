import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MeetingRequest {
  subject: string;
  startTime: string;
  endTime: string;
  participants: string[]; // Can be emails or UUIDs
  location?: string;
  timeZone?: string;
  isUpdate?: boolean;
  existingMeetingId?: string;
  meetingId?: string; // Database meeting ID for participant lookup
}

interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface CalendarEventResponse {
  id: string;
  subject: string;
  onlineMeeting?: {
    joinUrl: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting Teams meeting management request ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authorization header is required',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user from the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authentication token',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const hostUser = user.email;
    console.log('Authenticated user:', hostUser);
    
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { 
      subject, 
      startTime, 
      endTime, 
      participants, 
      location, 
      timeZone, 
      isUpdate, 
      existingMeetingId,
      meetingId 
    }: MeetingRequest = requestBody;

    // Validate required fields
    if (!subject || !startTime || !endTime) {
      console.error('Missing required fields:', { subject: !!subject, startTime: !!startTime, endTime: !!endTime });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: subject, startTime, and endTime are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Convert participants to emails if they are UUIDs
    let participantEmails: string[] = [];
    
    if (participants && participants.length > 0) {
      console.log('Processing participants:', participants);
      
      // Check if participants are UUIDs or emails
      const isUUIDs = participants.every(p => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p)
      );
      
      console.log('Participants are UUIDs:', isUUIDs);
      
      if (isUUIDs) {
        // Fetch emails from leads table
        try {
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('id, email, lead_name')
            .in('id', participants);
          
          if (leadsError) {
            console.error('Error fetching lead emails:', leadsError);
            // Continue with empty emails array
          } else {
            participantEmails = (leadsData || [])
              .map(lead => lead.email)
              .filter(Boolean);
            
            console.log('Converted UUIDs to emails:', {
              leads: leadsData,
              emails: participantEmails
            });
          }
        } catch (error) {
          console.error('Error converting participant UUIDs to emails:', error);
        }
      } else {
        // Check if they are emails
        const isEmails = participants.every(p => 
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p)
        );
        
        if (isEmails) {
          participantEmails = participants;
          console.log('Participants are already emails:', participantEmails);
        } else {
          // They might be display names, try to find them in the database
          console.log('Participants appear to be display names, trying to find emails...');
          
          try {
            const { data: leadsData, error: leadsError } = await supabase
              .from('leads')
              .select('lead_name, email')
              .in('lead_name', participants);
            
            if (leadsError) {
              console.error('Error fetching emails by name:', leadsError);
            } else {
              participantEmails = (leadsData || [])
                .map(lead => lead.email)
                .filter(Boolean);
              
              console.log('Found emails by name:', {
                names: participants,
                emails: participantEmails
              });
            }
          } catch (error) {
            console.error('Error finding emails by display name:', error);
          }
        }
      }
    }

    console.log('Final participant emails for Teams meeting:', participantEmails);

    // Get credentials from Supabase secrets
    const clientId = Deno.env.get('MICROSOFT_GRAPH_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_GRAPH_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_GRAPH_TENANT_ID');

    if (!clientId || !clientSecret || !tenantId) {
      console.error('Missing Microsoft Graph API credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Microsoft Graph API credentials not configured properly',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete existing meeting if updating
    if (isUpdate && existingMeetingId) {
      console.log('Deleting existing Teams meeting:', existingMeetingId);
      
      try {
        // Get access token for deletion
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const tokenBody = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        });

        const deleteTokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: tokenBody,
        });

        const deleteTokenData: GraphTokenResponse = await deleteTokenResponse.json();
        
        if (deleteTokenResponse.ok && deleteTokenData.access_token) {
          const deleteResponse = await fetch(
            `https://graph.microsoft.com/v1.0/users/${hostUser}/events/${existingMeetingId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${deleteTokenData.access_token}`,
                'Accept': 'application/json',
              },
            }
          );

          if (deleteResponse.ok) {
            console.log('Successfully deleted existing Teams meeting');
          } else {
            console.error('Failed to delete existing Teams meeting:', deleteResponse.status);
          }
        }
      } catch (error) {
        console.error('Error deleting existing meeting:', error);
        // Continue with creating new meeting even if deletion fails
      }
    }

    // Get access token for creating new meeting
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    console.log('Requesting access token...');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenBody,
    });

    const tokenData: GraphTokenResponse = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token request failed:', tokenData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication failed with Microsoft Graph API',
          details: tokenData.error_description || tokenData.error || 'Unknown authentication error',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully obtained access token');

    // Create calendar event data with Teams meeting
    const eventData = {
      subject: subject,
      start: {
        dateTime: startTime,
        timeZone: timeZone || 'UTC'
      },
      end: {
        dateTime: endTime,
        timeZone: timeZone || 'UTC'
      },
      attendees: participantEmails.map(email => ({
        emailAddress: {
          address: email,
          name: email
        },
        type: "required"
      })),
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
      location: {
        displayName: location || 'Online'
      }
    };

    console.log('Creating Teams meeting with event data:', JSON.stringify(eventData, null, 2));

    const meetingResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${hostUser}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    console.log('Meeting creation response status:', meetingResponse.status);

    const responseText = await meetingResponse.text();
    console.log('Meeting response:', responseText);

    if (!meetingResponse.ok) {
      console.error('Meeting creation failed:', {
        status: meetingResponse.status,
        body: responseText,
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to ${isUpdate ? 'update' : 'create'} Teams meeting`,
          details: responseText,
        }),
        {
          status: meetingResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse successful response
    const eventResult: CalendarEventResponse = JSON.parse(responseText);
    console.log('Teams meeting created successfully:', {
      eventId: eventResult.id,
      subject: eventResult.subject,
      joinUrl: eventResult.onlineMeeting?.joinUrl,
      attendeesCount: participantEmails.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        meetingUrl: eventResult.onlineMeeting?.joinUrl || null,
        meetingId: eventResult.id,
        subject: eventResult.subject,
        hostUser: hostUser,
        attendees: participantEmails,
        attendeesCount: participantEmails.length,
        message: `Microsoft Teams meeting ${isUpdate ? 'updated' : 'created'} successfully with ${participantEmails.length} attendees`,
        isUpdate: isUpdate || false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in manage-teams-meeting function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred while processing the Teams meeting',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});