import { useEffect, useState } from 'react'
import { Check, Store, MessageCircle } from 'lucide-react'
import useStore from '../store'
import { list, storeBranding, brandLogoURL } from './api'

export default function CustomerStoreLinks() {
  const userId = useStore(s => s.currentUser?.id)
  const setActivePage = useStore(s => s.setActivePage)
  const [result, setResult] = useState(null)
  const [revision, setRevision] = useState(0)
  const current = result?.userId === userId && result?.revision === revision ? result : null
  const connections = current?.rows ?? null
  const error = current?.error || ''
  useEffect(() => {
    let alive = true
    if (!userId) return () => { alive = false }
    list('relationships', { profile_id: userId, status: 'active' })
      .then(rows => Promise.all(rows.map(async row => ({ ...row, brand: await storeBranding(row.location_id).catch(() => null) }))))
      .then(rows => { if (alive) setResult({ userId, revision, rows }) })
      .catch(() => { if (alive) setResult({ userId, revision, error: 'Could not check your store connection.' }) })
    return () => { alive = false }
  }, [userId, revision])
  if (!userId || (connections && !connections.length)) return null
  function openChat(id) {
    const url = new URL(window.location.href)
    url.searchParams.set('store', id)
    window.history.replaceState({}, '', url)
    setActivePage('messages')
  }
  return <section className="app-page-inset mb-6 glass-card border border-border rounded-2xl p-4 anim-fade-in-up" aria-label="Linked stores">
    <div className="flex items-center gap-2 mb-3"><Store size={14} className="text-olive-light" /><h2 className="font-mono text-[10px] tracking-[0.3em] text-muted">{connections?.length > 1 ? 'LINKED STORES' : 'LINKED STORE'}</h2></div>
    {error ? <div><p role="alert" className="text-sm text-muted">{error}</p><button type="button" className="text-sm text-cream underline py-3" onClick={() => setRevision(value => value + 1)}>Retry store connection</button></div> : !connections ? <p role="status" className="text-xs text-muted">Checking store connection…</p> : <div className="space-y-4">
      {connections.map(connection => <div key={connection.id} className="space-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl border border-border bg-surface flex items-center justify-center overflow-hidden p-1.5">
            {connection.brand?.logo_path ? <img src={brandLogoURL(connection.brand.logo_path)} alt="" className="w-full h-full object-contain" /> : <Store size={20} className="text-muted" />}
          </div>
          <div className="min-w-0 flex-1"><p className="font-mono text-sm text-cream break-words">{connection.brand?.name || 'Your store'}</p><p className="flex items-center gap-1.5 font-mono text-xs text-olive-light mt-1"><Check size={12} aria-hidden="true" />Account linked</p></div>
        </div>
        <button type="button" className="flex items-center gap-2 min-h-11 px-3 py-2 rounded-xl border border-border bg-surface font-mono text-xs text-muted hover:text-cream hover:border-brown/50 transition-colors" onClick={() => openChat(connection.id)}><MessageCircle size={14} aria-hidden="true" />Message store</button>
      </div>)}
    </div>}
  </section>
}
