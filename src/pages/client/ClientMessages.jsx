import { useState, useRef, useEffect } from 'react'
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

export default function ClientMessages() {
  const { activeClientId, messages, sendMessage, markMessagesRead } = useStore()
  const [input, setInput] = useState('')
  const bottomRef         = useRef(null)

  const thread = messages[activeClientId] || []

  useEffect(() => {
    if (activeClientId) markMessagesRead(activeClientId, 'client')
  }, [activeClientId, thread.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(activeClientId, 'client', input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b border-border flex-shrink-0 anim-fade-in-down">
        <h1 className="font-display font-black text-3xl tracking-wider text-cream">
          <ScrambleText text="MESSAGES" duration={750} />
        </h1>
        <p className="font-mono text-xs text-muted mt-1">Chat with your coach</p>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {thread.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center anim-fade-in">
            <MessageCircle size={36} className="text-dim mb-3 anim-pop" style={{ animationDelay: '100ms' }} />
            <p className="font-display font-bold text-xl text-muted tracking-widest">NO MESSAGES YET</p>
            <p className="font-mono text-xs text-dim mt-1.5">Your coach will reach out here</p>
          </div>
        ) : (
          thread.map((msg) => {
            const isClient = msg.from === 'client'
            return (
              <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'} anim-fade-in`}>
                <div className={`max-w-[80%] flex flex-col gap-1 ${isClient ? 'items-end' : 'items-start'}`}>
                  {!isClient && (
                    <p className="font-display font-bold text-[10px] text-brown-light tracking-widest px-1 mb-0.5">
                      COACH
                    </p>
                  )}
                  <div
                    className={`px-4 py-2.5 font-mono text-sm leading-relaxed ${
                      isClient
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-border flex gap-2 flex-shrink-0 bg-surface pb-safe">
        <input
          type="text"
          placeholder="Message your coach…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 font-mono text-base text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-brown hover:bg-brown-light disabled:opacity-40 text-bg px-4 rounded-xl transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
