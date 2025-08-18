
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('User admin function called with method:', req.method);

    // Create admin client with service role key for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the user making the request is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user.user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user is admin for protected operations
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id)
      .single();

    const isAdmin = userRole?.role === 'admin';

    // GET - List all users (admin only)
    if (req.method === 'GET') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Fetching users list...');
      
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error('Error listing users:', error);
        return new Response(
          JSON.stringify({ error: `Failed to fetch users: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Users fetched successfully:', data?.users?.length || 0);
      return new Response(
        JSON.stringify({ users: data.users }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // POST - Create new user or handle specific actions
    if (req.method === 'POST') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      // Handle password reset with new password
      if (body.action === 'reset-password') {
        const { userId, newPassword } = body;
        if (!userId || !newPassword) {
          return new Response(
            JSON.stringify({ error: 'User ID and new password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Resetting password for user:', userId);

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (error) {
          console.error('Error resetting password:', error);
          return new Response(
            JSON.stringify({ error: `Password reset failed: ${error.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the password reset action
        await supabaseAdmin.rpc('log_security_event', {
          p_action: 'PASSWORD_RESET',
          p_resource_type: 'USER',
          p_resource_id: userId,
          p_details: { reset_by: user.user.id, timestamp: new Date().toISOString() }
        });

        console.log('Password reset successfully');
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Password reset successfully'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Handle role changes
      if (body.action === 'change-role') {
        const { userId, newRole } = body;
        if (!userId || !newRole || !['admin', 'user'].includes(newRole)) {
          return new Response(
            JSON.stringify({ error: 'Valid user ID and role (admin/user) are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Changing role for user:', userId, 'to:', newRole);

        // Update role in user_roles table
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: newRole,
            assigned_by: user.user.id,
            assigned_at: new Date().toISOString()
          });

        if (roleError) {
          console.error('Error updating role:', roleError);
          return new Response(
            JSON.stringify({ error: `Role update failed: ${roleError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the role change action
        await supabaseAdmin.rpc('log_security_event', {
          p_action: 'ROLE_CHANGE',
          p_resource_type: 'USER',
          p_resource_id: userId,
          p_details: { 
            new_role: newRole, 
            changed_by: user.user.id, 
            timestamp: new Date().toISOString() 
          }
        });

        console.log('Role updated successfully');
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Role updated successfully'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Handle user creation
      const { email, displayName, role, password } = body;
      
      if (!email || !password || !displayName) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and display name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Creating user:', email, 'with role:', role || 'user');

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: displayName
        },
        email_confirm: true
      });

      if (error) {
        console.error('Error creating user:', error);
        return new Response(
          JSON.stringify({ error: `User creation failed: ${error.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create profile record and set role
      if (data.user) {
        try {
          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: displayName,
              'Email ID': email
            });

          if (profileError) {
            console.warn('Profile creation failed:', profileError);
          } else {
            console.log('Profile created successfully for:', email);
          }

          // Set user role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: role || 'user',
              assigned_by: user.user.id
            });

          if (roleError) {
            console.warn('Role assignment failed:', roleError);
          } else {
            console.log('Role assigned successfully:', role || 'user');
          }

          // Log user creation
          await supabaseAdmin.rpc('log_security_event', {
            p_action: 'USER_CREATED',
            p_resource_type: 'USER',
            p_resource_id: data.user.id,
            p_details: { 
              created_by: user.user.id, 
              role: role || 'user',
              timestamp: new Date().toISOString() 
            }
          });

        } catch (err) {
          console.warn('Setup error:', err);
        }
      }

      console.log('User created successfully:', data.user?.email);
      return new Response(
        JSON.stringify({ 
          success: true,
          user: data.user,
          message: 'User created successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // PUT - Update user (including activation/deactivation)
    if (req.method === 'PUT') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { userId, displayName, action } = await req.json();
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Updating user:', userId, 'action:', action, 'displayName:', displayName);

      // Prepare update data for auth.users
      let updateData: any = {};

      // Handle display name updates
      if (displayName !== undefined) {
        updateData.user_metadata = { full_name: displayName };
      }

      // Handle user activation/deactivation
      if (action === 'activate') {
        updateData.ban_duration = 'none';
        console.log('Activating user:', userId);
      } else if (action === 'deactivate') {
        updateData.ban_duration = '876000h'; // ~100 years
        console.log('Deactivating user:', userId);
      }

      // Update auth user if needed
      if (Object.keys(updateData).length > 0) {
        console.log('Update data prepared:', JSON.stringify(updateData, null, 2));

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updateData
        );

        if (error) {
          console.error('Error updating user:', error);
          return new Response(
            JSON.stringify({ error: `User update failed: ${error.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the action
        if (action) {
          await supabaseAdmin.rpc('log_security_event', {
            p_action: action === 'activate' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            p_resource_type: 'USER',
            p_resource_id: userId,
            p_details: { 
              changed_by: user.user.id, 
              timestamp: new Date().toISOString() 
            }
          });
        }
      }

      // Update profile if display name changed
      if (displayName !== undefined) {
        try {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ full_name: displayName })
            .eq('id', userId);

          if (profileError) {
            console.warn('Profile update failed:', profileError);
          } else {
            console.log('Profile updated successfully for user:', userId);
          }
        } catch (profileErr) {
          console.warn('Profile update error:', profileErr);
        }
      }

      console.log('User updated successfully:', userId);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'User updated successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // DELETE - Delete user (admin only)
    if (req.method === 'DELETE') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { userId } = await req.json();
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required for deletion' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Deleting user:', userId);

      try {
        // Log user deletion
        await supabaseAdmin.rpc('log_security_event', {
          p_action: 'USER_DELETED',
          p_resource_type: 'USER',
          p_resource_id: userId,
          p_details: { 
            deleted_by: user.user.id, 
            timestamp: new Date().toISOString() 
          }
        });

        // Delete the auth user (cascade will handle related records)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError);
          return new Response(
            JSON.stringify({ 
              error: `User deletion failed: ${authDeleteError.message}` 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('User deleted successfully:', userId);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User deleted successfully',
            userId: userId 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      } catch (deleteError: any) {
        console.error('Unexpected error during user deletion:', deleteError);
        return new Response(
          JSON.stringify({ 
            error: `Deletion failed: ${deleteError.message || 'Unknown error'}` 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Unexpected error in user-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
