import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { MessageCircle, Search, ChevronRight } from 'lucide-react'
import useStore from '../../store'
import ClientAvatar from '../../components/ClientAvatar'
import ScrambleText from '../../components/ScrambleText'
import {
  accentA, msgTime, msgPreview, buildThread, lastSeenSelfId,
  DaySep, Bubble, Composer,
} from '../../components/ChatKit'

export default function CoachChat() {
  const {
    clients, messages, sendMessage, markMessagesRead,
    pendingChatClientId, setPendingChatClientId,
    getClientTotalsForDate, setViewingClientId, setActivePage,
  } = useStore()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch]         = useState('')

  // Auto-open thread when arriving from coach dashboard message icon
  useEffect(() => {
    if (pendingChatClientId) {
      setSelectedId(pendingChatClientId)
      setPendingChatClientId(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedClient = clients.find((c) => c.id === selectedId)
  const thread         = messages[selectedId] || []

  const unreadFor = (clientId) =>
    (messages[clientId] || []).filter((m) => m.from === 'client' && !m.readByCoach).length

  const totalUnread = clients.reduce((n, c) => n + unreadFor(c.id), 0)

  // Mark read when thread opens or new messages arrive
  useEffect(() => {
    if (selectedId) markMessagesRead(selectedId, 'coach')
  }, [selectedId, thread.length])

  const handleViewProfile = () => {
    if (!selectedClient) return
    setViewingClientId(selectedClient.id, 'overview')
    setActivePage('clients')
  }

  /* Roster: unread first, then most-recent conversation, then the rest */
  const roster = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clients
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .map((c) => {
        const lastMsg = (messages[c.id] || []).slice(-1)[0]
        return { client: c, lastMsg, unread: unreadFor(c.id) }
      })
      .sort((a, b) => {
        if ((b.unread > 0) !== (a.unread > 0)) return b.unread > 0 ? 1 : -1
        const ta = a.lastMsg?.timestamp || ''
        const tb = b.lastMsg?.timestamp || ''
        return tb.localeCompare(ta)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, messages, search])

  /* Thread with day separators + sender grouping, built forward then reversed
     for flex-col-reverse rendering (newest anchored at the bottom) */
  const threadItems = useMemo(() => buildThread(thread).reverse(), [thread])
  const seenId      = useMemo(() => lastSeenSelfId(thread, 'coach'), [thread])

  /* Selected client context for the thread header */
  const todayStr  = format(new Date(), 'yyyy-MM-dd')
  const selTotals = selectedClient ? getClientTotalsForDate(selectedClient.id, todayStr) : null
  const selPct    = selectedClient
    ? Math.round((selTotals.calories / (selectedClient.goals.calories || 1)) * 100)
    : 0
  const selLogged = selectedClient ? (selectedClient.log?.[todayStr] || []).length > 0 : false

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: roster ─────────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
        <div className="relative px-6 pt-7 pb-4 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-px flex-shrink-0" style={{ background: accentA(50) }} />
            <p className="font-mono text-[10px] tracking-[0.22em] text-muted">INBOX</p>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="font-display font-black text-3xl tracking-wider text-cream leading-none">
              <ScrambleText text="CHAT" duration={700} />
            </h2>
            {totalUnread > 0 && (
              <div className="text-right">
                <p className="font-display font-black text-xl leading-none" style={{ color: 'var(--color-accent)' }}>
                  {totalUnread}
                </p>
                <p className="font-mono text-[8px] tracking-[0.2em] text-muted mt-0.5">UNREAD</p>
              </div>
            )}
          </div>
          {/* Search */}
          <div className="relative mt-4">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-2 font-mono text-xs text-cream placeholder:text-dim focus:outline-none focus:border-brown transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {roster.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4 anim-fade-in">
              <MessageCircle size={24} className="text-dim mb-2" />
              <p className="font-mono text-xs text-dim">{search ? 'No matches' : 'No users yet'}</p>
            </div>
          ) : (
            roster.map(({ client, lastMsg, unread }, i) => {
              const isActive = selectedId === client.id
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedId(client.id)}
                  style={{
                    animationDelay: `${i * 35}ms`,
                    ...(isActive ? {
                      background: `linear-gradient(90deg, ${accentA(14)}, ${accentA(4)})`,
                      border: `1px solid ${accentA(28)}`,
                    } : {}),
                  }}
                  className={`anim-fade-in-up w-full flex items-center gap-3 px-3.5 py-3 text-left rounded-2xl transition-colors ${
                    isActive ? '' : 'border border-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} className="w-10 h-10" textClassName="text-sm" />
                    {unread > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-mono text-[9px] font-bold"
                        style={{ background: 'var(--color-accent)', color: '#fff' }}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display font-bold text-sm text-cream truncate">{client.name}</p>
                      {lastMsg && (
                        <p className="font-mono text-[9px] text-dim flex-shrink-0">{msgTime(lastMsg.timestamp)}</p>
                      )}
                    </div>
                    {lastMsg ? (
                      <p className={`font-mono text-xs truncate mt-0.5 ${unread > 0 ? 'text-cream' : 'text-muted'}`}>
                        {lastMsg.from === 'coach' ? 'You: ' : ''}{msgPreview(lastMsg)}
                      </p>
                    ) : (
                      <p className="font-mono text-xs text-dim mt-0.5">No messages yet</p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: thread ────────────────────────────────────────────────── */}
      {selectedClient ? (
        <div key={selectedId} className="flex-1 flex flex-col overflow-hidden anim-fade-in">
          {/* Thread header — identity + live nutrition context */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0 glass-panel">
            <div className="relative">
              <ClientAvatar name={selectedClient.name} avatarUrl={selectedClient.avatarUrl} className="w-10 h-10" textClassName="text-sm" />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{
                  background: selLogged ? 'var(--color-accent)' : 'var(--color-dim)',
                  borderColor: 'var(--color-bg)',
                }}
                title={selLogged ? 'Logged today' : 'No log today'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-base text-cream truncate">{selectedClient.name}</p>
              <p className="font-mono text-[11px] text-muted">
                {selLogged
                  ? `${selTotals.calories.toFixed(0)} / ${selectedClient.goals.calories} kcal today · ${selPct}%`
                  : 'Nothing logged today'}
              </p>
            </div>
            <button
              onClick={handleViewProfile}
              className="flex items-center gap-1 h-9 px-3 rounded-xl border border-border text-muted hover:text-cream hover:border-muted transition-colors flex-shrink-0"
            >
              <span className="font-display font-bold text-[10px] tracking-widest">PROFILE</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Messages — flex-col-reverse anchors newest at bottom */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col-reverse">
            {threadItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center anim-fade-in">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 anim-pop"
                  style={{ background: accentA(10), border: `1px solid ${accentA(25)}` }}
                >
                  <MessageCircle size={26} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="font-display font-bold text-xl text-muted tracking-widest">NO MESSAGES</p>
                <p className="font-mono text-sm text-dim mt-1">
                  Send {selectedClient.name.split(' ')[0]} a message below
                </p>
              </div>
            ) : (
              threadItems.map((item) =>
                item.type === 'sep' ? (
                  <DaySep key={item.id} label={item.label} />
                ) : (
                  <Bubble
                    key={item.id}
                    msg={item.msg}
                    isSelf={item.msg.from === 'coach'}
                    first={item.first}
                    last={item.last}
                    seen={item.msg.id === seenId}
                    maxW="max-w-[64%]"
                    avatar={
                      <ClientAvatar
                        name={selectedClient.name}
                        avatarUrl={selectedClient.avatarUrl}
                        className="w-7 h-7"
                        textClassName="text-[11px]"
                      />
                    }
                  />
                )
              )
            )}
          </div>

          {/* Composer — attachments, quick replies, auto-growing input */}
          <div className="px-6 py-4 border-t border-border flex-shrink-0 glass-panel">
            <Composer
              clientId={selectedClient.id}
              placeholder={`Message ${selectedClient.name.split(' ')[0]}…`}
              templates
              onSendText={(text) => sendMessage(selectedClient.id, 'coach', text)}
              onSendAttachment={(att) => sendMessage(selectedClient.id, 'coach', '', att)}
            />
          </div>
        </div>
      ) : (
        /* Empty state — pick a conversation */
        <div className="flex-1 flex flex-col items-center justify-center text-center anim-fade-in relative">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse 40% 35% at 50% 45%, ${accentA(6)}, transparent 65%)` }}
          />
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 anim-pop"
            style={{ background: accentA(10), border: `1px solid ${accentA(25)}` }}
          >
            <MessageCircle size={32} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="flex items-center gap-2 mb-2 justify-center">
            <span className="w-5 h-px" style={{ background: accentA(50) }} />
            <p className="font-mono text-[10px] tracking-[0.22em] text-muted">MESSAGES</p>
            <span className="w-5 h-px" style={{ background: accentA(50) }} />
          </div>
          <p className="font-display font-black text-3xl text-cream tracking-widest">SELECT A USER</p>
          <p className="font-mono text-sm text-dim mt-2">Choose a conversation from the left to start chatting</p>
        </div>
      )}
    </div>
  )
}
