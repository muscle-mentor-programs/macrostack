import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    // Use the service-role client for everything — this bypasses RLS entirely,
    // so we never hit the recursive policy issue that can block profile reads.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify the caller's JWT using the admin client (no RLS involved)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    // Fetch the caller's role via service role (bypasses RLS entirely)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile lookup error:', profileError.message)
      throw new Error('Could not verify user role: ' + profileError.message)
    }

    if (!profile || !['coach', 'superadmin'].includes(profile.role)) {
      throw new Error('Only coaches can invite clients')
    }

    const { email, clientName } = await req.json()
    if (!email) throw new Error('email is required')

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      // Explicit redirect so the invite link always points to the live app
      redirectTo: 'https://getmacrostack.com',
      data: { role: 'client', name: clientName ?? email.split('@')[0] },
    })

    if (inviteError) throw inviteError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('invite-client error:', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
