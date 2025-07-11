
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
    // Create admin client with service role
    const supabaseAdmin = createClient(
      'https://cxzbnjhuksvkigwtybwk.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create client to verify user auth
    const supabase = createClient(
      'https://cxzbnjhuksvkigwtybwk.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.log('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Authenticated user:', user.id, user.email)

    // Check if user has admin role in profiles table using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('User profile:', profile, 'Error:', profileError)

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(JSON.stringify({ error: 'Could not verify user role' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!profile || profile.role !== 'admin') {
      console.log('User role:', profile?.role, 'Required: admin')
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Admin access verified for user:', user.id)

    const { action, ...params } = await req.json()
    console.log('Action:', action, 'Params:', params)

    let result
    let error

    switch (action) {
      case 'listUsers':
        const listResult = await supabaseAdmin.auth.admin.listUsers()
        result = listResult.data
        error = listResult.error
        break

      case 'createUser':
        console.log('Creating user with params:', params)
        
        // Validate required parameters
        if (!params.email || !params.password) {
          return new Response(JSON.stringify({ error: 'Email and password are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const createResult = await supabaseAdmin.auth.admin.createUser({
          email: params.email,
          password: params.password,
          email_confirm: !params.sendEmail,
          user_metadata: {
            role: params.role || 'member',
            display_name: params.displayName || params.email
          }
        })
        
        console.log('User creation result:', createResult)
        
        // If user creation is successful, also create a profile record
        if (createResult.data.user && !createResult.error) {
          console.log('Creating profile for user:', createResult.data.user.id)
          
          // Insert profile using raw SQL to avoid enum casting issues
          const { error: profileError } = await supabaseAdmin.rpc('create_user_profile', {
            user_id: createResult.data.user.id,
            display_name: params.displayName || params.email,
            email: params.email,
            user_role: params.role || 'member'
          })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't fail the entire operation if profile creation fails
            // The user was created successfully in auth
          } else {
            console.log('Profile created successfully')
          }
        }
        
        result = createResult.data
        error = createResult.error
        break

      case 'deleteUser':
        const deleteResult = await supabaseAdmin.auth.admin.deleteUser(params.userId)
        result = deleteResult.data
        error = deleteResult.error
        break

      case 'updateUser':
        const updateResult = await supabaseAdmin.auth.admin.updateUserById(params.userId, {
          user_metadata: { 
            display_name: params.displayName,
            ...params.userMetadata 
          }
        })
        result = updateResult.data
        error = updateResult.error
        break

      case 'bulkUpdateUsers':
        const updates = params.updates || []
        const results = []
        
        for (const update of updates) {
          if (update.action === 'update') {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(update.userId, {
              user_metadata: { display_name: update.displayName }
            })
            if (updateError) {
              console.error('Bulk update error:', updateError)
            }
            results.push({ userId: update.userId, error: updateError })
          } else if (update.action === 'delete') {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(update.userId)
            if (deleteError) {
              console.error('Bulk delete error:', deleteError)
            }
            results.push({ userId: update.userId, error: deleteError })
          }
        }
        result = { results }
        break

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    if (error) {
      console.error('Admin operation error:', error)
      return new Response(JSON.stringify({ error: error.message || 'Operation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
