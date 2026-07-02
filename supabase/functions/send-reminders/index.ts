import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ════════════════════════════════════════════════════════════════════════════
// AUTOMATED REMINDERS
// Invoked daily by pg_cron (late afternoon US time). For every active client
// with an email and reminders enabled, nudge them if they:
//   • haven't logged any food today, and/or
//   • haven't submitted a check-in in the last 7 days (account ≥ 7 days old)
// One email per client per day max (reminder_last_sent guard), delivered via
// the site's existing /api/email/notify route so Resend config stays in one
// place.
// ════════════════════════════════════════════════════════════════════════════

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAY_MS = 86_400_000

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.getmacrostack.com'
    const today = new Date().toISOString().slice(0, 10)

    // ── Apply any due scheduled target changes first ──────────────────────
    const { data: dueSchedules } = await admin.from('target_schedules')
      .select('*').eq('applied', false).lte('apply_on', today)
    for (const s of dueSchedules || []) {
      await admin.from('clients').update({
        goal_calories: s.calories, goal_protein: s.protein,
        goal_carbs: s.carbs, goal_fat: s.fat,
      }).eq('id', s.client_id)
      await admin.from('target_schedules').update({ applied: true }).eq('id', s.id)
    }

    // Active clients with an email who haven't opted out and weren't already
    // reminded today.
    const { data: clients, error: cErr } = await admin
      .from('clients')
      .select('id, name, email, coach_id, created_at, reminders_enabled, reminder_last_sent')
      .eq('status', 'active')
      .neq('email', '')
    if (cErr) throw cErr

    const candidates = (clients || []).filter((c) =>
      c.email &&
      (c.reminders_enabled ?? true) &&
      c.reminder_last_sent !== today
    )
    if (!candidates.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const ids = candidates.map((c) => c.id)

    // Who logged food today?
    const { data: logged } = await admin
      .from('food_log')
      .select('client_id')
      .eq('date', today)
      .in('client_id', ids)
    const loggedToday = new Set((logged || []).map((r) => r.client_id))

    // Most recent check-in per client (last 30 days is plenty)
    const since = new Date(Date.now() - 30 * DAY_MS).toISOString()
    const { data: checkins } = await admin
      .from('checkins')
      .select('client_id, created_at')
      .gte('created_at', since)
      .in('client_id', ids)
    const lastCheckin = new Map<string, string>()
    for (const r of checkins || []) {
      const prev = lastCheckin.get(r.client_id)
      if (!prev || r.created_at > prev) lastCheckin.set(r.client_id, r.created_at)
    }

    // Coach names for the email copy
    const coachIds = [...new Set(candidates.map((c) => c.coach_id).filter(Boolean))]
    const coachNames = new Map<string, string>()
    if (coachIds.length) {
      const { data: coaches } = await admin
        .from('profiles').select('id, name').in('id', coachIds)
      for (const p of coaches || []) coachNames.set(p.id, p.name)
    }

    const weekAgo = Date.now() - 7 * DAY_MS
    let sent = 0
    const remindedIds: string[] = []

    for (const c of candidates) {
      const missedLog = !loggedToday.has(c.id)
      const last = lastCheckin.get(c.id)
      const accountOldEnough = new Date(c.created_at).getTime() < weekAgo
      const missedCheckin = accountOldEnough && (!last || new Date(last).getTime() < weekAgo)

      if (!missedLog && !missedCheckin) continue

      const res = await fetch(`${siteUrl}/api/email/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:           'reminder',
          recipientEmail: c.email,
          recipientName:  c.name,
          coachName:      coachNames.get(c.coach_id) || null,
          missedLog,
          missedCheckin,
        }),
      })
      if (res.ok) {
        sent++
        remindedIds.push(c.id)
      }
    }

    // Stamp so a re-run today no-ops for these clients
    if (remindedIds.length) {
      await admin.from('clients')
        .update({ reminder_last_sent: today })
        .in('id', remindedIds)
    }

    return new Response(JSON.stringify({ ok: true, sent, considered: candidates.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
