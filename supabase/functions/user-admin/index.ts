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
    console.log('User admin function called')
    
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

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

    console.log('User verified:', user.email)

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

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

    console.log('Admin access confirmed')

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
    console.log('Action:', action, 'Params:', params)

    let result
    let error

    switch (action) {
      case 'listUsers':
        console.log('Listing users')
        const listResult = await supabaseAdmin.auth.admin.listUsers()
        result = listResult.data?.users || []
        error = listResult.error
        console.log('Listed users count:', result.length)
        break

      case 'createUser':
        console.log('Creating user with email:', params.email)
        
        if (!params.email || !params.password) {
          return new Response(
            JSON.stringify({ error: 'Email and password are required' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const createResult = await supabaseAdmin.auth.admin.createUser({
          email: params.email,
          password: params.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            display_name: params.displayName || params.email.split('@')[0]
          }
        })

        if (createResult.error) {
          console.error('User creation failed:', createResult.error)
          error = createResult.error
        } else {
          console.log('User created successfully:', createResult.data.user?.id)
          
          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: createResult.data.user.id,
              full_name: params.displayName || params.email.split('@')[0],
              role: params.role || 'member'
            })

          if (profileError) {
            console.error('Profile creation failed:', profileError)
            // Don't fail the whole operation for profile creation
          } else {
            console.log('Profile created successfully')
          }
          
          result = createResult.data
        }
        break

      case 'updateUser':
        console.log('Updating user:', params.userId)
        const updateResult = await supabaseAdmin.auth.admin.updateUserById(
          params.userId,
          {
            user_metadata: {
              display_name: params.displayName
            }
          }
        )
        result = updateResult.data
        error = updateResult.error
        break

      case 'deleteUser':
        console.log('Deleting user:', params.userId)
        const deleteResult = await supabaseAdmin.auth.admin.deleteUser(params.userId)
        result = deleteResult.data
        error = deleteResult.error
        break

      case 'changeRole':
        console.log('Changing user role:', params.userId, 'to', params.role)
        
        if (!params.userId || !params.role) {
          return new Response(
            JSON.stringify({ error: 'User ID and role are required' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Update the profile role
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ role: params.role })
          .eq('id', params.userId)

        if (profileUpdateError) {
          console.error('Profile role update failed:', profileUpdateError)
          error = profileUpdateError
        } else {
          console.log('User role updated successfully')
          result = { success: true, message: 'Role updated successfully' }
        }
        break

      default:
        console.error('Unknown action:', action)
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    if (error) {
      console.error('Operation failed:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Operation failed' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Operation completed successfully')
    return new Response(
      JSON.stringify({ data: result }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
