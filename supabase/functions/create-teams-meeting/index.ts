
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
  attendees: string[];
  location?: string;
  timeZone?: string;
  isUpdate?: boolean;
  existingTeamsLink?: string;
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
    console.log('=== Starting Teams meeting creation/update request ===');
    
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
    
    const { subject, startTime, endTime, attendees, location, timeZone, isUpdate, existingTeamsLink }: MeetingRequest = requestBody;

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

    // Get credentials from Supabase secrets
    const clientId = Deno.env.get('MICROSOFT_GRAPH_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_GRAPH_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_GRAPH_TENANT_ID');

    console.log('Using Microsoft Graph API credentials from secrets with host user:', hostUser);
    console.log('Client ID:', clientId ? 'Set' : 'Not set');
    console.log('Client Secret:', clientSecret ? 'Set' : 'Not set');
    console.log('Tenant ID:', tenantId ? 'Set' : 'Not set');
    console.log('Is Update Request:', isUpdate);

    if (!clientId || !clientSecret || !tenantId) {
      console.error('Missing Microsoft Graph API credentials in Supabase secrets');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Microsoft Graph API credentials not configured properly',
          details: 'Please ensure MICROSOFT_GRAPH_CLIENT_ID, MICROSOFT_GRAPH_CLIENT_SECRET, and MICROSOFT_GRAPH_TENANT_ID are set in Supabase secrets',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get access token using client credentials flow
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    console.log('Requesting access token via client credentials flow...');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenBody,
    });

    console.log('Token response status:', tokenResponse.status);

    const tokenData: GraphTokenResponse = await tokenResponse.json();
    console.log('Token response received');
    
    if (!tokenResponse.ok) {
      console.error('Token request failed:', {
        status: tokenResponse.status,
        error: tokenData.error,
        error_description: tokenData.error_description,
      });
      
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

    if (!tokenData.access_token) {
      console.error('No access token received');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No access token received from Microsoft Graph API',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully obtained access token via client credentials flow');

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
      attendees: attendees.map(email => ({
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

    console.log(`${isUpdate ? 'Updating' : 'Creating'} calendar event with Teams meeting:`, JSON.stringify(eventData, null, 2));

    let meetingUrl: string;
    let method: string;
    
    if (isUpdate && existingTeamsLink) {
      // For updates, we'll create a new meeting since Microsoft Graph doesn't allow direct meeting link updates
      // The old meeting will remain accessible but we'll provide a new link
      console.log('Creating new Teams meeting for update (old meeting remains accessible)');
      meetingUrl = `https://graph.microsoft.com/v1.0/users/${hostUser}/events`;
      method = 'POST';
    } else {
      // Create new meeting
      meetingUrl = `https://graph.microsoft.com/v1.0/users/${hostUser}/events`;
      method = 'POST';
    }
    
    console.log('Using endpoint:', meetingUrl, 'Method:', method);

    const meetingResponse = await fetch(meetingUrl, {
      method: method,
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    console.log('Meeting operation response status:', meetingResponse.status);

    const responseText = await meetingResponse.text();
    console.log('Meeting response:', responseText);

    if (!meetingResponse.ok) {
      console.error(`Meeting ${isUpdate ? 'update' : 'creation'} failed:`, {
        status: meetingResponse.status,
        body: responseText,
        endpoint: meetingUrl,
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to ${isUpdate ? 'update' : 'create'} Teams meeting for user ${hostUser}`,
          details: responseText,
          troubleshooting: {
            status: meetingResponse.status,
            endpoint: meetingUrl,
            hostUser: hostUser,
            requiredPermissions: ['Calendars.ReadWrite (Application)'],
            note: 'Make sure your app registration has the correct permissions and admin consent has been granted'
          }
        }),
        {
          status: meetingResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse successful response
    const eventResult: CalendarEventResponse = JSON.parse(responseText);
    console.log(`Calendar event ${isUpdate ? 'updated' : 'created'} successfully for user:`, hostUser, 'Event ID:', eventResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        meetingUrl: eventResult.onlineMeeting?.joinUrl || null,
        meetingId: eventResult.id,
        subject: eventResult.subject,
        hostUser: hostUser,
        message: `Microsoft Teams meeting ${isUpdate ? 'updated' : 'created'} successfully for ${hostUser}`,
        isUpdate: isUpdate || false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in create-teams-meeting function:', error);
    
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
