import { useState, useEffect } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { MessageCircle, Send } from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'

function msgTime(ts) {
  const d = parseISO(ts)
  if (isToday(d))     return format(d, 'h:mm a')
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
  return format(d, 'MMM d, h:mm a')
}

export default function CoachChat() {
  const { clients, messages, sendMessage, markMessagesRead } = useStore()
  const [selectedId, setSelectedId] = useState(null)
  const [input, setInput]           = useState('')

  const selectedClient = clients.find((c) => c.id === selectedId)
  const thread         = messages[selectedId] || []

  const unreadFor = (clientId) =>
    (messages[clientId] || []).filter((m) => m.from === 'client' && !m.readByCoach).length

  const totalUnread = clients.reduce((n, c) => n + unreadFor(c.id), 0)

  // Mark read when thread opens or new messages arrive
  useEffect(() => {
    if (selectedId) markMessagesRead(selectedId, 'coach')
  }, [selectedId, thread.length])

  const handleSend = () => {
    if (!input.trim() || !selectedId) return
    sendMessage(selectedId, 'coach', input.trim())
    setInput('')
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: client list ─────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-6 py-6 border-b border-border flex-shrink-0 anim-fade-in-down">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-black text-2xl tracking-wider text-cream">
              <ScrambleText text="CHAT" duration={700} />
            </h2>
            {totalUnread > 0 && (
              <span className="font-mono text-xs text-bg bg-brown px-1.5 py-0.5 rounded-full font-bold">
                {totalUnread}
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-muted mt-1">{clients.length} conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4 anim-fade-in">
              <MessageCircle size={24} className="text-dim mb-2" />
              <p className="font-mono text-xs text-dim">No clients yet</p>
            </div>
          ) : (
            clients.map((client, i) => {
              const lastMsg  = (messages[client.id] || []).slice(-1)[0]
              const unread   = unreadFor(client.id)
              const isActive = selectedId === client.id
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedId(client.id)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`anim-fade-in-up w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    isActive ? 'bg-brown/10 border-l-2 border-l-brown' : 'hover:bg-card'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center">
                      <span className="font-display font-black text-sm text-brown-light">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-cream truncate">{client.name}</p>
                    {lastMsg ? (
                      <p className={`font-mono text-xs truncate ${unread > 0 ? 'text-cream' : 'text-muted'}`}>
                        {lastMsg.from === 'coach' ? 'You: ' : ''}{lastMsg.text}
                      </p>
                    ) : (
                      <p className="font-mono text-xs text-dim">No messages yet</p>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="font-mono text-[10px] text-dim flex-shrink-0">
                      {msgTime(lastMsg.timestamp)}
                    </p>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: thread ─────────────────────────────────── */}
      {selectedClient ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Thread header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-black text-sm text-brown-light">
                {selectedClient.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-display font-bold text-base text-cream">{selectedClient.name}</p>
              <p className="font-mono text-xs text-muted">{selectedClient.email || 'No email on file'}</p>
            </div>
          </div>

          {/* Messages — flex-col-reverse anchors newest at bottom (iMessage style) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col-reverse gap-4">
            {thread.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center anim-fade-in">
                <MessageCircle size={36} className="text-dim mb-3 anim-pop" />
                <p className="font-display font-bold text-xl text-muted tracking-widest">NO MESSAGES</p>
                <p className="font-mono text-sm text-dim mt-1">
                  Send {selectedClient.name.split(' ')[0]} a message below
                </p>
              </div>
            ) : (
              [...thread].reverse().map((msg) => {
                const isCoach = msg.from === 'coach'
                return (
                  <div key={msg.id} className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[68%] flex flex-col gap-1 ${isCoach ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2.5 font-mono text-sm leading-relaxed ${
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

          {/* Input */}
          <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0 bg-surface">
            <input
              type="text"
              placeholder={`Message ${selectedClient.name.split(' ')[0]}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-bg border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-brown hover:bg-brown-light disabled:opacity-40 text-bg px-4 py-2.5 rounded-xl transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center anim-fade-in">
          <MessageCircle size={44} className="text-dim mb-4" />
          <p className="font-display font-bold text-2xl text-muted tracking-widest">SELECT A CLIENT</p>
          <p className="font-mono text-sm text-dim mt-2">Choose a client from the left to start chatting</p>
        </div>
      )}
    </div>
  )
}
