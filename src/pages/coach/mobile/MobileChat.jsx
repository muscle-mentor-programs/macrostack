import { useState, useEffect } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { ChevronLeft, ChevronRight, MessageCircle, Send } from 'lucide-react'
import useStore from '../../../store'
import ScrambleText from '../../../components/ScrambleText'



function msgTime(ts) {
  if (!ts) return ''
  try {
    const d = parseISO(ts)
    if (isNaN(d.getTime())) return ''
    if (isToday(d))     return format(d, 'h:mm a')
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
    return format(d, 'MMM d, h:mm a')
  } catch {
    return ''
  }
}

// ── Thread screen ─────────────────────────────────────────────────────────────
function ThreadScreen({ client, onBack }) {
  const { messages, sendMessage, markMessagesRead, setNavHidden } = useStore()
  const [input, setInput] = useState('')
  const thread = messages[client.id] || []

  useEffect(() => {
    markMessagesRead(client.id, 'coach')
  }, [client.id, thread.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hide CoachBottomNav while keyboard is open
  useEffect(() => {
    return () => setNavHidden(false) // restore on unmount
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(client.id, 'coach', input.trim())
    setInput('')
  }

  return (
    <div className="fixed inset-0 bg-surface z-40 flex flex-col overflow-hidden anim-slide-right">
      {/* Header — bg-surface extends all the way to the status bar */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-cream hover:bg-card transition-colors flex-shrink-0"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
          <span className="font-display font-black text-sm text-brown-light">
            {client.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-base text-cream truncate">{client.name}</p>
          <p className="font-mono text-xs text-muted">{client.email || 'No email on file'}</p>
        </div>
      </div>

      {/* Messages — flex-col-reverse anchors newest at bottom (iMessage style) */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-bg px-4 py-4 flex flex-col-reverse gap-3">
        {thread.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center anim-fade-in">
            <MessageCircle size={36} className="text-dim mb-3" />
            <p className="font-display font-bold text-lg text-muted tracking-widest">NO MESSAGES</p>
            <p className="font-mono text-sm text-dim mt-1">
              Send {client.name.split(' ')[0]} a message below
            </p>
          </div>
        ) : (
          [...thread].reverse().map((msg) => {
            const isCoach = msg.from === 'coach'
            return (
              <div key={msg.id} className={`flex anim-fade-in ${isCoach ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] flex flex-col gap-1 ${isCoach ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-1.5 font-mono text-sm leading-relaxed tracking-tight ${
                      isCoach
                        ? 'bg-brown text-bg rounded-2xl rounded-br-sm'
                        : 'bg-card border border-border text-cream rounded-2xl rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="font-mono text-[10px] text-dim px-1">{msgTime(msg.timestamp)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border bg-surface flex gap-2 flex-shrink-0 pb-safe">
        <input
          type="text"
          placeholder={`Message ${client.name.split(' ')[0]}…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          onFocus={() => setNavHidden(true)}
          onBlur={() => setNavHidden(false)}
          className="flex-1 bg-bg border border-border rounded-2xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-11 h-11 self-end bg-brown hover:bg-brown-light disabled:opacity-40 text-bg rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MobileChat() {
  const { clients, messages, pendingChatClientId, setPendingChatClientId } = useStore()
  const [selectedId, setSelectedId] = useState(null)

  // If coach tapped the chat icon on a specific client card, open that thread immediately
  useEffect(() => {
    if (pendingChatClientId) {
      setSelectedId(pendingChatClientId)
      setPendingChatClientId(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedClient = clients.find((c) => c.id === selectedId)

  const unreadFor = (clientId) =>
    (messages[clientId] || []).filter((m) => m.from === 'client' && !m.readByCoach).length

  const totalUnread = clients.reduce((n, c) => n + unreadFor(c.id), 0)

  return (
    <div className="flex flex-col min-h-full w-full overflow-x-hidden">
      {/* Header */}
      <div className="px-4 pt-14 pb-3 border-b border-border anim-fade-in-down">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-black text-3xl tracking-wider text-cream">
            <ScrambleText text="CHAT" duration={700} />
          </h2>
          {totalUnread > 0 && (
            <span className="font-mono text-xs text-bg bg-brown px-2 py-0.5 rounded-full font-bold">
              {totalUnread}
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-muted mt-0.5">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'}
        </p>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8 anim-fade-in">
          <MessageCircle size={30} className="text-dim mb-3" />
          <p className="font-display font-bold text-xl text-muted tracking-widest">NO CLIENTS</p>
          <p className="font-mono text-sm text-dim mt-1">Add clients to start chatting</p>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3 pb-20">
          {clients.map((client, i) => {
            const lastMsg = (messages[client.id] || []).slice(-1)[0]
            const unread  = unreadFor(client.id)
            return (
              <button
                key={client.id}
                onClick={() => setSelectedId(client.id)}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                className={`anim-fade-in-up w-full bg-card border rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:bg-surface ${
                  unread > 0 ? 'border-brown/40 hover:border-brown/60' : 'border-border hover:border-border/80'
                }`}
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-black text-base text-brown-light">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + timestamp */}
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-display font-bold text-sm text-cream tracking-wide truncate">
                      {client.name}
                    </p>
                    {lastMsg && (
                      <p className="font-mono text-[10px] text-dim flex-shrink-0 ml-2">
                        {msgTime(lastMsg.timestamp)}
                      </p>
                    )}
                  </div>

                  {/* Message preview */}
                  <p className={`font-mono text-xs truncate ${unread > 0 ? 'text-cream' : 'text-muted'}`}>
                    {lastMsg
                      ? `${lastMsg.from === 'coach' ? 'You: ' : ''}${lastMsg.text}`
                      : 'No messages yet — tap to start'}
                  </p>

                  {/* Email */}
                  <p className="font-mono text-[10px] text-dim mt-0.5 truncate">
                    {client.email || 'No email on file'}
                  </p>
                </div>

                {/* Unread badge or chevron */}
                {unread > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold flex-shrink-0">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : (
                  <ChevronRight size={14} className="text-dim flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Thread overlay */}
      {selectedClient && (
        <ThreadScreen client={selectedClient} onBack={() => setSelectedId(null)} />
      )}
    </div>
  )
}
