import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

// ════════════════════════════════════════════════════════════════════════════
// WEB PUSH
// Sends a push notification to every subscription of a target profile.
// Callers must be authenticated AND related to the target (their coach or
// their client) — verified server-side. Dead subscriptions are pruned.
// Also invoked with the service role by scheduled functions (reminders).
// ════════════════════════════════════════════════════════════════════════════

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const pub  = Deno.env.get('VAPID_PUBLIC_KEY')
    const priv = Deno.env.get('VAPID_PRIVATE_KEY')
    if (!pub || !priv) throw new Error('Push is not configured (missing VAPID keys).')
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') || 'mailto:support@getmacrostack.com', pub, priv)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const isServiceCall = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const { profileId, title, body } = await req.json()
    if (!profileId) throw new Error('Missing profileId')

    if (!isServiceCall) {
      const { data: { user }, error: userError } = await admin.auth.getUser(token)
      if (userError || !user) throw new Error('Unauthorized')
      // Caller must be related to the target: their coach, or their client.
      const { count } = await admin.from('clients')
        .select('id', { count: 'exact', head: true })
        .or(`and(coach_id.eq.${user.id},profile_id.eq.${profileId}),and(coach_id.eq.${profileId},profile_id.eq.${user.id})`)
      if (!count) throw new Error('Not allowed to notify this user.')
    }

    const { data: subs } = await admin.from('push_subscriptions')
      .select('id, subscription').eq('profile_id', profileId)

    let sent = 0
    for (const s of subs || []) {
      try {
        await webpush.sendNotification(
          s.subscription,
          JSON.stringify({ title: title || 'MacroStack', body: body || '', url: '/' })
        )
        sent++
      } catch (e) {
        // 404/410 = subscription is dead — prune it
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
