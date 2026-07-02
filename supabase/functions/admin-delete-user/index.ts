import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ════════════════════════════════════════════════════════════════════════════
// ADMIN DELETE USER (superadmin only)
// Removes the target's LOGIN (auth user; profile cascades away) while keeping
// their data: client rows survive with profile_id nulled (logs, check-ins,
// photos intact) and are flipped to 'pending' so they re-link automatically
// if the person signs up again with the same email. A deleted coach's clients
// keep their data too (coach_id nulls out).
// ════════════════════════════════════════════════════════════════════════════

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    // Caller must be a superadmin — checked with the service role, not RLS
    const { data: caller } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (caller?.role !== 'superadmin') throw new Error('Superadmin only.')

    const { profileId } = await req.json()
    if (!profileId) throw new Error('Missing profileId')
    if (profileId === user.id) throw new Error("You can't delete your own account from here.")

    const { data: target } = await admin.from('profiles')
      .select('name, role').eq('id', profileId).single()
    if (!target) throw new Error('No account found for that user.')

    // Preserve + prepare their client rows: back to 'pending' so the data
    // re-links on a fresh signup with the same email. (profile_id/coach_id
    // null out via FKs when the auth user goes.)
    await admin.from('clients')
      .update({ status: 'pending' })
      .eq('profile_id', profileId)

    // Remove login access — profile row cascades away with the auth user.
    const { error: delErr } = await admin.auth.admin.deleteUser(profileId)
    if (delErr) throw new Error(delErr.message)

    return new Response(JSON.stringify({ ok: true, deleted: target.name || profileId, role: target.role }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
