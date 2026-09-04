import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Self-serve signup that does NOT depend on Supabase's built-in confirmation
// mailer (which fails with "Error sending confirmation email" when no custom
// SMTP is configured). We create the user already email-confirmed via the
// admin API, so the client can sign in immediately. No email is sent.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { email, password, name, role } = await req.json()

    const cleanEmail = (email || '').trim().toLowerCase()
    if (!cleanEmail || !password) throw new Error('Email and password are required')
    if (password.length < 6) throw new Error('Password must be at least 6 characters')

    // Only the two self-serve roles may be created here; superadmin is never
    // self-assignable.
    const safeRole = role === 'coach' ? 'coach' : 'client'

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true, // skip the confirmation email entirely
      // Keep the validated role here until the database migration that reads
      // app_metadata is applied; direct client signup never receives this
      // server-validated value.
      user_metadata: { name: (name || '').trim() || cleanEmail.split('@')[0], role: safeRole },
      app_metadata: { role: safeRole },
    })

    if (error) {
      // Surface a friendly "already registered" so the client can route to sign-in
      const msg = error.message || 'Could not create account'
      const already = /already.*regist|already.*exist|duplicate/i.test(msg)
      return new Response(
        JSON.stringify({ error: already ? 'An account with this email already exists.' : msg, already }),
        { status: already ? 409 : 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
