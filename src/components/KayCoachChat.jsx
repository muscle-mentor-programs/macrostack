import { useRef, useState, useEffect } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { Sparkles, Send, X, Loader2 } from 'lucide-react'
import useStore from '../store'

/* ── Kay for coaches — roster-aware Q&A ───────────────────────────────────────
   Builds a compact snapshot of the whole roster (targets, compliance, weight
   trend, last check-in) and lets the coach interrogate it: "who's slipping?",
   "summarize Emma's month", "who should I check on today?". */

function rosterSnapshot(clients, getTotals) {
  const lines = clients
    .filter((c) => c.status !== 'archived')
    .map((c) => {
      const days7 = Array.from({ length: 7 }, (_, i) => {
        const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
        return (c.log?.[d] || []).length > 0
      }).filter(Boolean).length
      const today = format(new Date(), 'yyyy-MM-dd')
      const t = getTotals(c.id, today)
      const wl = [...(c.weightLog || [])].sort((a, b) => a.date.localeCompare(b.date))
      const wTrend = wl.length >= 2
        ? `${wl[0].value}→${wl[wl.length - 1].value} ${wl[wl.length - 1].unit}`
        : 'no weight data'
      const lastCk = c.checkins?.[0]?.createdAt
        ? format(parseISO(c.checkins[0].createdAt), 'MMM d')
        : 'never'
      const ckSummary = c.checkins?.[0]?.answers?.length
        ? c.checkins[0].answers
            .filter((a) => a.type === 'scale' && a.value)
            .map((a) => `${a.label.split(' ').slice(0, 2).join(' ')}: ${a.value}/5`)
            .join(', ')
        : ''
      return `- ${c.name}: targets ${c.goals.calories}kcal/${c.goals.protein}p · today ${Math.round(t.calories)}kcal · logged ${days7}/7 days · weight ${wTrend} · last check-in ${lastCk}${ckSummary ? ` (${ckSummary})` : ''}${c.tags?.length ? ` · tags: ${c.tags.join(',')}` : ''}`
    })
  return lines.join('\n')
}

export default function KayCoachChat({ onClose }) {
  const { clients, getClientTotalsForDate, currentUser } = useStore()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey ${currentUser?.name?.split(' ')[0] || 'coach'} — ask me anything about your roster. Who's slipping, who's crushing it, what to focus on today.` },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const ask = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    const history = [...messages, { role: 'user', content: q }]
    setMessages(history)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 900,
          system: `You are Kay, the sharp and practical nutrition-coaching assistant inside MacroStack.
You are talking to the COACH about their client roster. Be specific, concise, and actionable —
name names, cite the numbers below, and suggest concrete next steps. Today is ${format(new Date(), 'MMM d, yyyy')}.

ROSTER SNAPSHOT:
${rosterSnapshot(clients, getClientTotalsForDate)}`,
          messages: history.slice(-10).map(({ role, content }) => ({ role, content })),
        }),
      })
      if (!res.ok) throw new Error('Kay is unavailable right now.')
      const data = await res.json()
      const text = data.content?.[0]?.text || 'Hmm, I came up empty — try rephrasing?'
      setMessages((m) => [...m, { role: 'assistant', content: text }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: e.message || 'Something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in p-4">
      <div className="bg-card border border-border rounded-2xl w-[560px] max-w-full h-[70vh] flex flex-col shadow-2xl anim-fade-in-up overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={15} style={{ color: 'var(--color-accent)' }} />
            <div>
              <p className="font-display font-black text-base tracking-widest text-cream">ASK KAY</p>
              <p className="font-mono text-[10px] text-muted">Knows your whole roster</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-cream p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] rounded-2xl px-4 py-2.5 font-mono text-sm leading-relaxed whitespace-pre-wrap"
                style={m.role === 'user'
                  ? { background: 'var(--color-accent)', color: '#fff' }
                  : { background: 'var(--color-surface)', color: 'var(--color-cream)', border: '1px solid var(--color-border)' }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-muted">
              <Loader2 size={13} className="animate-spin" />
              <span className="font-mono text-xs">Kay is thinking…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 p-4 border-t border-border flex-shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            placeholder="Who needs attention this week?"
            className="flex-1 min-w-0 bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown"
          />
          <button
            onClick={ask}
            disabled={!input.trim() || loading}
            className="btn-accent text-bg font-display font-bold px-4 rounded-xl disabled:opacity-40 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
