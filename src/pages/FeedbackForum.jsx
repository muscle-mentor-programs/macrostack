import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUp, Bug, Lightbulb, RefreshCw } from 'lucide-react'
import useStore from '../store'
import useIsSuperadmin from '../hooks/useIsSuperadmin'
import { supabase } from '../lib/supabase'
import './FeedbackForum.css'

export default function FeedbackForum() {
  const admin = useIsSuperadmin()
  const role = useStore(s => s.activeRole)
  const user = useStore(s => s.currentUser)
  const setPage = useStore(s => s.setActivePage)
  const [adminForum, setAdminForum] = useState('coach')
  const forum = admin ? adminForum : role === 'client' ? 'user' : 'coach'
  return <div className="feedback-page app-page-gutter">
    {role === 'client' && <button className="feedback-back" onClick={() => setPage('profile')}><ArrowLeft size={16} /> Back to profile</button>}
    <header><p className="feedback-eyebrow">MACROSTACK COMMUNITY</p><h1>{admin ? 'FEEDBACK FORUMS' : 'FEATURES & BUGS'}</h1>
      <p>{admin ? 'Review coach and user feedback in separate forums.' : `Help improve the ${forum === 'coach' ? 'coaching portal' : 'user experience'}. Request a feature, report a bug, or upvote an idea.`}</p></header>
    {admin && <nav className="feedback-switch" aria-label="Choose feedback forum">{['coach', 'user'].map(value => <button key={value} aria-pressed={forum === value} onClick={() => setAdminForum(value)}>{value === 'coach' ? 'Coach forum' : 'User forum'}</button>)}</nav>}
    <ForumBoard key={`${forum}-${user?.id}`} forum={forum} userId={user?.id} />
  </div>
}

function ForumBoard({ forum, userId }) {
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(25)
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [kind, setKind] = useState('feature')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const generation = useRef(0)
  const alive = useRef(true)
  const refresh = useCallback(async () => {
    const request = ++generation.current
    try {
    const { data, error: failure } = await supabase.from('feedback_ranked')
      .select('*').eq('forum', forum).order('vote_count', { ascending: false })
      .order('created_at', { ascending: true }).order('id', { ascending: true }).range(0, limit)
    if (!alive.current || request !== generation.current) return
    setLoading(false)
    if (failure) {
      setError('Feedback could not be loaded. Please retry. If this forum is new, setup may still be in progress.')
      return
    }
    setRows((data || []).slice(0, limit)); setMore((data || []).length > limit)
    setReady(true); setError('')
    } catch {
      if (alive.current && request === generation.current) {
        setLoading(false)
        setError('Feedback could not be loaded. Please check your connection and retry.')
      }
    }
  }, [forum, limit])
  useEffect(() => {
    alive.current = true
    refresh()
    const update = () => { if (document.visibilityState === 'visible' && !lock.current) refresh() }
    const timer = setInterval(update, 30000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => { alive.current = false; generation.current++; clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update) }
  }, [refresh])

  async function mutate(action, success) {
    if (lock.current || !ready || !userId) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const result = await action()
      if (result.error && result.error.code !== '23505') throw result.error
      if (!alive.current) return
      success?.(); await refresh()
    } catch {
      if (alive.current) setError('That change could not be saved. Your draft is still here. Please try again.')
    } finally {
      lock.current = false
      if (alive.current) setBusy(false)
    }
  }
  return <>
    <div className="feedback-context"><strong>{forum === 'coach' ? 'Coach forum' : 'User forum'}</strong><span>Visible to this community and superadmins. Do not include personal, client, or health information.</span></div>
    <div className="feedback-columns">
      <form className="glass-card feedback-compose" onSubmit={e => { e.preventDefault(); if (title.trim().length < 3 || body.trim().length < 10) return; mutate(() => supabase.from('feedback_submissions').insert({forum, kind, title: title.trim(), body: body.trim()}), () => { setTitle(''); setBody(''); setNotice('Submission posted. Others can now upvote it.') }) }}>
        <h2>Share feedback</h2>
        <label>Submission type<select value={kind} onChange={e => setKind(e.target.value)} disabled={busy}><option value="feature">Feature request</option><option value="bug">Bug report</option></select></label>
        <label>Title<input value={title} onChange={e => setTitle(e.target.value)} required minLength={3} maxLength={120} disabled={busy} placeholder="A short, specific summary" /></label>
        <label>Details<textarea value={body} onChange={e => setBody(e.target.value)} required minLength={10} maxLength={5000} disabled={busy} placeholder={kind === 'bug' ? 'What happened? What did you expect? Include steps to reproduce and your browser or device.' : 'What would you like to do, and how would it help?'} /></label>
        <button className="btn-accent feedback-submit" disabled={!ready || busy || !userId || title.trim().length < 3 || body.trim().length < 10}>{busy ? 'Saving…' : 'Post submission'}</button>
      </form>
      <section aria-label="Feedback submissions">
        <div className="feedback-list-heading"><div><h2>Community submissions</h2><p>Most votes first. Ties stay in submission order, oldest first.</p></div><button aria-label="Refresh submissions" disabled={busy} onClick={refresh}><RefreshCw size={17} /></button></div>
        {error && <div role="alert" className="feedback-error">{error} <button onClick={refresh} disabled={busy}>Retry</button></div>}
        {notice && <p role="status" className="feedback-notice">{notice}</p>}
        {loading && <p role="status">Loading feedback…</p>}
        {!loading && ready && rows.length === 0 && <div className="glass-card feedback-empty">No submissions yet. Be the first to share an idea or report a bug.</div>}
        <div className="feedback-list">{rows.map(row => {
          const Icon = row.kind === 'bug' ? Bug : Lightbulb
          return <article className="glass-card feedback-record" key={row.id}>
            <button className="feedback-vote" aria-label={`${row.has_voted ? 'Remove upvote from' : 'Upvote'} ${row.title}`} aria-pressed={row.has_voted} disabled={busy || !userId} onClick={() => mutate(() => row.has_voted ? supabase.from('feedback_votes').delete().eq('submission_id', row.id).eq('voter_id', userId).eq('forum', forum) : supabase.from('feedback_votes').insert({submission_id: row.id, forum}))}><ArrowUp size={18} /><strong>{row.vote_count}</strong><span>votes</span></button>
            <div className="feedback-record-body"><div className="feedback-meta"><span><Icon size={14} />{row.kind === 'bug' ? 'Bug report' : 'Feature request'}</span><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}</time>{row.is_author && <span>Your submission</span>}</div><h3>{row.title}</h3><p>{row.body}</p></div>
          </article>
        })}</div>
        {more && <button className="feedback-more" disabled={busy} onClick={() => setLimit(n => n + 25)}>Show more submissions</button>}
      </section>
    </div>
  </>
}
