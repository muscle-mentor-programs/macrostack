/* ── Web push registration ────────────────────────────────────────────────────
   Registers the service worker and subscribes the browser to push, storing the
   subscription in Supabase (push_subscriptions) via the store. */

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function pushPermission() {
  return pushSupported() ? Notification.permission : 'unsupported'
}

/* Ask permission (if needed), subscribe, and persist via registerPushSubscription.
   Returns { ok, reason? }. */
export async function enablePush(registerPushSubscription) {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapid) return { ok: false, reason: 'not-configured' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    })
  }
  await registerPushSubscription(sub.toJSON())
  return { ok: true }
}

/* Silently re-sync an existing subscription (called on app load when
   permission was already granted — keeps the DB row fresh). */
export async function resyncPush(registerPushSubscription) {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return
    if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) return
    const reg = await navigator.serviceWorker.register('/sw.js')
    const sub = await reg.pushManager.getSubscription()
    if (sub) await registerPushSubscription(sub.toJSON())
  } catch { /* best-effort */ }
}
