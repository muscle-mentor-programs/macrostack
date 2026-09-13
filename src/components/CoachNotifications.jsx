import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import useStore from '../store'
import './CoachNotifications.css'

export default function CoachNotifications({ compact = false }) {
  const user = useStore(s => s.currentUser)
  if (!user || !['coach', 'superadmin'].includes(user.role)) return null
  return <NotificationInbox key={user.id} coachId={user.id} compact={compact} />
}

function NotificationInbox({ coachId, compact }) {
  const dialog = useRef(null)
  const request = useRef(0)
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [unread, setUnread] = useState(0)
  const [limit, setLimit] = useState(50)
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let alive = true
    async function load() {
      if (document.visibilityState === 'hidden') return
      const version = ++request.current
      try {
        const [feed, count] = await Promise.all([
          supabase.from('coach_marketplace_notifications').select('*').eq('coach_id', coachId)
            .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit + 1),
          supabase.from('coach_marketplace_notifications').select('id', { count: 'exact', head: true })
            .eq('coach_id', coachId).is('read_at', null),
        ])
        if (feed.error || count.error) throw new Error('Notifications could not load. Please retry.')
        if (!alive || version !== request.current) return
        setRows(feed.data.slice(0, limit)); setMore(feed.data.length > limit)
        setUnread(count.count || 0); setError(''); setLoaded(true)
      } catch (failure) { if (alive && version === request.current) { setError(failure.message); setLoaded(true) } }
    }
    load()
    const timer = window.setInterval(load, 30000)
    window.addEventListener('focus', load)
    document.addEventListener('visibilitychange', load)
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', load); document.removeEventListener('visibilitychange', load) }
  }, [coachId, limit, open, refresh])

  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal()
    else if (!open && dialog.current.open) dialog.current.close()
  }, [open])

  async function markRead(id) {
    const at = new Date().toISOString()
    let query = supabase.from('coach_marketplace_notifications').update({ read_at: at }).eq('coach_id', coachId).is('read_at', null)
    query = id ? query.eq('id', id) : query.lte('created_at', at)
    const result = await query
    if (result.error) throw new Error('Could not mark notifications as read. Please retry.')
    setRefresh(n => n + 1)
  }
  async function readAll() {
    setBusy(true); setError('')
    try { await markRead() } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  async function openClient(row) {
    setBusy(true); setError('')
    try {
      const client = await supabase.from('clients').select('id').eq('id', row.client_id).eq('coach_id', coachId).maybeSingle()
      if (client.error || !client.data) throw new Error('This client is no longer linked to your coach account.')
      await useStore.getState().loadAllData()
      await markRead(row.id)
      const store = useStore.getState()
      store.setPortalMode('coach')
      store.setViewingClientId(row.client_id, 'overview')
      store.setActivePage('clients')
      setOpen(false)
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }

  return <>
    <button type="button" className={`coach-notification-trigger ${compact ? 'is-compact' : ''}`}
      onClick={() => setOpen(true)} aria-label={`Marketplace notifications${unread ? `, ${unread} unread` : ''}`}
      aria-haspopup="dialog" aria-expanded={open}>
      <Bell size={17} />{!compact && <span>Notifications</span>}
      {unread > 0 && <span className="coach-notification-badge" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {createPortal(<dialog ref={dialog} className="coach-notification-dialog" aria-labelledby="coach-notification-title"
      onClose={() => setOpen(false)} onCancel={() => setOpen(false)}>
      <div className="coach-notification-heading">
        <div><h2 id="coach-notification-title" className="font-display text-2xl">NOTIFICATIONS</h2><p className="text-muted text-sm">New marketplace clients</p></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><X size={20} /></button>
      </div>
      <div className="coach-notification-actions">
        <button type="button" disabled={busy || !unread} onClick={readAll}>Mark all read</button>
        <button type="button" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Refresh</button>
      </div>
      <div className="coach-notification-feed" aria-busy={busy}>
        {error && <p role="alert" className="text-red-400 p-4">{error}</p>}
        {!loaded ? <p role="status" className="p-4 text-muted">Loading notifications...</p>
          : !error && !rows.length ? <p className="p-4 text-muted">No new marketplace clients yet. Confirmed signups will appear here.</p> : null}
        {rows.map(row => <button key={row.id} type="button" disabled={busy} onClick={() => openClient(row)}
          className={`coach-notification-item ${!row.read_at ? 'is-unread' : ''}`}>
          <UserPlus size={21} aria-hidden="true" />
          <span><strong>{row.client_name} joined through your marketplace</strong>
            <span className="block text-sm text-muted">Payment confirmed. Open client workspace.</span>
            <time className="block text-xs text-muted mt-2" dateTime={row.created_at}>{new Date(row.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
            {!row.read_at && <span className="text-xs">Unread</span>}
          </span>
        </button>)}
        {more && <button type="button" className="coach-notification-more" disabled={busy} onClick={() => setLimit(n => n + 50)}>Load older notifications</button>}
      </div>
    </dialog>, document.body)}
  </>
}
