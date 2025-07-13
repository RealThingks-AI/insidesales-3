import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatabaseUser {
  id: string;
  email: string;
  phone: string | null;
  email_confirmed_at: string | null;
  phone_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  app_metadata: any;
  user_metadata: any;
  role: string;
  display_name: string;
}

serve(async (req) => {
  console.log('User-admin function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Log environment variables to verify project connection
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Role Key prefix:', serviceRoleKey.substring(0, 20) + '...');
    
    // Verify we're connecting to the correct project (npvldkoyvrxsuonuilbx)
    if (!supabaseUrl.includes('npvldkoyvrxsuonuilbx')) {
      console.error('WRONG PROJECT! Expected npvldkoyvrxsuonuilbx but got:', supabaseUrl);
      throw new Error(`Wrong Supabase project. Expected npvldkoyvrxsuonuilbx but connecting to: ${supabaseUrl}`);
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get current user from auth header for permission checking
    const token = authHeader.replace('Bearer ', '');
    const { data: currentUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !currentUser.user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('Current user:', currentUser.user.email);

    // Parse request body
    const body = await req.json();
    const { action } = body;

    console.log('Action requested:', action);

    switch (action) {
      case 'listUsers': {
        console.log('Listing all users from auth.users...');
        
        // Get users from auth.users with pagination
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error listing users:', listError);
          throw listError;
        }

        console.log(`Found ${users.users?.length || 0} users`);
        
        // Format users to include role from user_metadata
        const formattedUsers: DatabaseUser[] = users.users?.map(user => ({
          id: user.id,
          email: user.email || '',
          phone: user.phone,
          email_confirmed_at: user.email_confirmed_at,
          phone_confirmed_at: user.phone_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_sign_in_at: user.last_sign_in_at,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata,
          role: user.user_metadata?.role || 'member',
          display_name: user.user_metadata?.display_name || 
                       user.user_metadata?.full_name || 
                       user.email?.split('@')[0] || 'User'
        })) || [];

        return new Response(JSON.stringify(formattedUsers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'createUser': {
        const { email, password, displayName, role = 'member' } = body;
        
        console.log('Creating user:', email, 'with role:', role);
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          user_metadata: {
            display_name: displayName || email.split('@')[0],
            full_name: displayName || email.split('@')[0],
            role: role,
            email_verified: true
          },
          email_confirm: true
        });

        if (createError) {
          console.error('Error creating user:', createError);
          throw createError;
        }

        console.log('User created successfully:', newUser.user?.email);

        return new Response(JSON.stringify({ 
          success: true, 
          user: {
            ...newUser.user,
            role: role,
            display_name: displayName || email.split('@')[0]
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'updateUser': {
        const { userId, displayName, role } = body;
        
        console.log('Updating user:', userId, 'displayName:', displayName, 'role:', role);
        
        // Get current user metadata
        const { data: currentUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) {
          throw getUserError;
        }

        const currentMetadata = currentUserData.user?.user_metadata || {};
        
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              ...currentMetadata,
              ...(displayName && { 
                display_name: displayName, 
                full_name: displayName 
              }),
              ...(role && { role: role })
            }
          }
        );

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }

        console.log('User updated successfully:', updatedUser.user?.email);

        return new Response(JSON.stringify({ success: true, user: updatedUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'deleteUser': {
        const { userId } = body;
        
        console.log('=== DELETE USER DEBUG START ===');
        console.log('Deleting user ID:', userId);
        console.log('Supabase URL being used:', supabaseUrl);
        console.log('Current time:', new Date().toISOString());
        
        try {
          // First, try to get the user to verify it exists
          console.log('Step 1: Checking if user exists...');
          const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
          
          if (getUserError) {
            console.error('Error getting user before delete:', getUserError);
            return new Response(JSON.stringify({ 
              error: `User not found or access denied: ${getUserError.message}`,
              details: getUserError,
              step: 'getUserById'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          console.log('Step 2: User found, attempting deletion...');
          console.log('User to delete:', userData.user?.email);
          
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

          if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return new Response(JSON.stringify({ 
              error: `Failed to delete user: ${deleteError.message}`,
              details: deleteError,
              step: 'deleteUser'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          console.log('Step 3: User deleted successfully');
          console.log('=== DELETE USER DEBUG END ===');

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('=== UNEXPECTED ERROR DURING USER DELETION ===');
          console.error('Error type:', typeof error);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          console.error('Full error object:', error);
          console.log('=== DELETE USER DEBUG END ===');
          
          return new Response(JSON.stringify({ 
            error: `Unexpected error: ${error.message}`,
            details: error,
            step: 'unexpected'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      case 'changeRole': {
        const { userId, role } = body;
        
        console.log('Changing user role:', userId, 'to', role);
        
        // Get current user metadata
        const { data: currentUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getUserError) {
          console.error('Error getting user:', getUserError);
          throw getUserError;
        }

        console.log('Current user data:', JSON.stringify(currentUserData.user, null, 2));

        const currentMetadata = currentUserData.user?.user_metadata || {};
        const updatedMetadata = {
          ...currentMetadata,
          role: role
        };
        
        console.log('Updating user metadata to:', JSON.stringify(updatedMetadata, null, 2));
        
        // Update user role in user_metadata
        const { data: updatedUser, error: roleUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: updatedMetadata
          }
        );

        if (roleUpdateError) {
          console.error('Error updating user role:', roleUpdateError);
          throw roleUpdateError;
        }

        console.log('Role change completed successfully. Updated user:', JSON.stringify(updatedUser.user, null, 2));

        return new Response(JSON.stringify({ success: true, user: updatedUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'syncUsers': {
        console.log('Syncing users - fetching latest from auth.users');
        
        // This endpoint can be used for real-time polling
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error syncing users:', listError);
          throw listError;
        }

        const formattedUsers: DatabaseUser[] = users.users?.map(user => ({
          id: user.id,
          email: user.email || '',
          phone: user.phone,
          email_confirmed_at: user.email_confirmed_at,
          phone_confirmed_at: user.phone_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_sign_in_at: user.last_sign_in_at,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata,
          role: user.user_metadata?.role || 'member',
          display_name: user.user_metadata?.display_name || 
                       user.user_metadata?.full_name || 
                       user.email?.split('@')[0] || 'User'
        })) || [];

        return new Response(JSON.stringify({ 
          success: true, 
          users: formattedUsers,
          lastSync: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in user-admin function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});