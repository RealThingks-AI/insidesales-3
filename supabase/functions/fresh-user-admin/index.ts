import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== FRESH USER ADMIN FUNCTION CALLED ===')
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header')
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token received, length:', token.length)

    // Create Supabase clients with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey
    })

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create client for user verification
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User verified:', user.email, 'ID:', user.id)

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Admin client created successfully')

    // Check if user is admin using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Profile check result:', { profile, profileError })

    if (profileError) {
      console.error('Profile check failed:', profileError)
      return new Response(
        JSON.stringify({ error: 'Unable to verify user permissions' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!profile || profile.role !== 'admin') {
      console.error('User is not admin. Role:', profile?.role)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✓ Admin access confirmed for user:', user.email)

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (e) {
      console.error('Invalid JSON in request body:', e)
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { action, ...params } = requestBody
    console.log('Action requested:', action)
    console.log('Parameters:', params)

    let result
    let error

    switch (action) {
      case 'listUsers':
        console.log('→ Listing all auth users')
        try {
          const listResult = await supabaseAdmin.auth.admin.listUsers()
          result = listResult.data?.users || []
          error = listResult.error
          console.log('✓ Listed users count:', result.length)
        } catch (e) {
          console.error('✗ List users failed:', e)
          error = e
        }
        break

      case 'createUser':
        console.log('→ Creating new user with email:', params.email)
        
        if (!params.email || !params.password) {
          console.error('✗ Missing required fields')
          return new Response(
            JSON.stringify({ error: 'Email and password are required' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        try {
          // Create user in auth.users table using admin client
          console.log('→ Creating auth user...')
          const createResult = await supabaseAdmin.auth.admin.createUser({
            email: params.email,
            password: params.password,
            email_confirm: true, // Auto-confirm so user can login immediately
            user_metadata: {
              display_name: params.displayName || params.email.split('@')[0]
            }
          })

          console.log('Auth user creation result:', {
            success: !createResult.error,
            userId: createResult.data?.user?.id,
            error: createResult.error
          })

          if (createResult.error) {
            console.error('✗ Auth user creation failed:', createResult.error)
            error = createResult.error
          } else {
            console.log('✓ Auth user created with ID:', createResult.data.user?.id)
            
            // Create profile in profiles table using admin client
            console.log('→ Creating user profile...')
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: createResult.data.user.id,
                full_name: params.displayName || params.email.split('@')[0],
                'Email ID': params.email,
                role: params.role || 'member'
              })

            if (profileError) {
              console.error('✗ Profile creation failed:', profileError)
              // Don't fail the operation since auth user was created successfully
              console.log('⚠️ Auth user exists even though profile creation failed')
            } else {
              console.log('✓ Profile created successfully')
            }
            
            result = {
              user: createResult.data.user,
              message: 'User created successfully in auth.users table',
              profileCreated: !profileError
            }
          }
        } catch (e) {
          console.error('✗ Unexpected error during user creation:', e)
          error = e
        }
        break

      case 'deleteUser':
        console.log('→ Deleting user:', params.userId)
        try {
          const deleteResult = await supabaseAdmin.auth.admin.deleteUser(params.userId)
          result = deleteResult.data
          error = deleteResult.error
          if (!error) {
            console.log('✓ User deleted successfully')
          } else {
            console.error('✗ User deletion failed:', error)
          }
        } catch (e) {
          console.error('✗ Unexpected error during user deletion:', e)
          error = e
        }
        break

      case 'changeRole':
        console.log('→ Changing user role:', params.userId, 'to', params.role)
        
        if (!params.userId || !params.role) {
          return new Response(
            JSON.stringify({ error: 'User ID and role are required' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        try {
          // Update the profile role using admin client
          const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: params.role })
            .eq('id', params.userId)

          if (profileUpdateError) {
            console.error('✗ Profile role update failed:', profileUpdateError)
            error = profileUpdateError
          } else {
            console.log('✓ User role updated successfully')
            result = { success: true, message: 'Role updated successfully' }
          }
        } catch (e) {
          console.error('✗ Unexpected error during role change:', e)
          error = e
        }
        break

      case 'listProfiles':
        console.log('→ Listing all profiles')
        try {
          const profilesResult = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            
          result = profilesResult.data || []
          error = profilesResult.error
          console.log('✓ Listed profiles count:', result.length)
        } catch (e) {
          console.error('✗ List profiles failed:', e)
          error = e
        }
        break

      default:
        console.error('✗ Unknown action:', action)
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    if (error) {
      console.error('✗ Operation failed with error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Operation failed' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✓ Operation completed successfully')
    return new Response(
      JSON.stringify({ data: result }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('✗ Unexpected error in function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})