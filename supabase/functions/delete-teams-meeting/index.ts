import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteMeetingRequest {
  meetingId: string;
}

interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting Teams meeting deletion request ===');
    
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
    
    const { meetingId }: DeleteMeetingRequest = requestBody;

    // Validate required fields
    if (!meetingId) {
      console.error('Missing meeting ID');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required field: meetingId',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Teams meeting deletion requested for ID:', meetingId);

    // Get credentials from Supabase secrets
    const clientId = Deno.env.get('MICROSOFT_GRAPH_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_GRAPH_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_GRAPH_TENANT_ID');

    if (!clientId || !clientSecret || !tenantId) {
      console.log('Microsoft Graph API credentials not available, skipping calendar deletion');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Meeting deleted from CRM. Teams meeting may need to be deleted manually from calendar.',
          warning: 'Microsoft Graph API not fully configured for meeting deletion'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Get access token for Microsoft Graph API
      console.log('Getting access token for Graph API...');
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Failed to get access token:', await tokenResponse.text());
        throw new Error('Failed to authenticate with Microsoft Graph API');
      }

      const tokenData: GraphTokenResponse = await tokenResponse.json();
      console.log('Successfully obtained access token');

      // Delete the meeting from Microsoft Graph using the stored meeting ID
      console.log('Attempting to delete Teams meeting with ID:', meetingId);
      console.log('Deleting for user:', hostUser);
      
      const deleteResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${hostUser}/events/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (deleteResponse.ok || deleteResponse.status === 404) {
        console.log('Teams meeting deleted successfully or was already deleted');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Teams meeting deleted successfully from calendar'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        console.error('Failed to delete Teams meeting:', deleteResponse.status, await deleteResponse.text());
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Meeting deleted from CRM. Teams meeting may need manual deletion.',
            warning: 'Could not automatically delete Teams meeting from calendar'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

    } catch (error: any) {
      console.error('Error deleting Teams meeting:', error);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Meeting deleted from CRM. Teams meeting may need manual deletion.',
          warning: 'Error occurred while trying to delete Teams meeting: ' + error.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error: any) {
    console.error('Unexpected error in delete-teams-meeting function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred while deleting the Teams meeting',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});