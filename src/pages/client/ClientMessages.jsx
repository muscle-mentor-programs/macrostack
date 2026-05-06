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

const NAV_H = 80

export default function ClientMessages() {
  const { activeClientId, messages, sendMessage, markMessagesRead } = useStore()
  const [input, setInput]     = useState('')
  const [kbHeight, setKbHeight] = useState(0)

  const thread = messages[activeClientId] || []

  // Mark messages read whenever thread updates
  useEffect(() => {
    if (activeClientId) markMessagesRead(activeClientId, 'client')
  }, [activeClientId, thread.length])

  // Track software keyboard height via the visualViewport API (iOS + Android)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      // keyboard height = difference between layout height and visual height
      const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKbHeight(kh)
    }
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(activeClientId, 'client', input.trim())
    setInput('')
  }

  // When keyboard is hidden → sit above the nav bar + safe area
  // When keyboard is shown  → sit above the keyboard (covers nav, which is correct)
  const bottomVal = kbHeight > 0
    ? `${kbHeight}px`
    : `calc(${NAV_H}px + env(safe-area-inset-bottom, 0px))`

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-bg z-10"
      style={{ bottom: bottomVal }}
    >
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b border-border flex-shrink-0 anim-fade-in-down">
        <h1 className="font-display font-black text-3xl tracking-wider text-cream">
          <ScrambleText text="MESSAGES" duration={750} />
        </h1>
        <p className="font-mono text-xs text-muted mt-1">Chat with your coach</p>
      </div>

      {/* Thread — flex-col-reverse anchors newest messages at the bottom (iMessage style) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col-reverse gap-4">
        {thread.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageCircle size={36} className="text-dim mb-3 anim-pop" />
            <p className="font-display font-bold text-xl text-muted tracking-widest">NO MESSAGES YET</p>
            <p className="font-mono text-xs text-dim mt-1.5">Your coach will reach out here</p>
          </div>
        ) : (
          // Reverse so DOM order is newest-first; flex-col-reverse flips it back
          // visually so newest = bottom, oldest = top
          [...thread].reverse().map((msg) => {
            const isClient = msg.from === 'client'
            return (
              <div
                key={msg.id}
                className={`flex ${isClient ? 'justify-end' : 'justify-start'} anim-fade-in`}
              >
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
      </div>

      {/* Input bar — always flush against nav or keyboard */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-surface border-t border-border">
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
          className="flex items-center justify-center bg-brown hover:bg-brown-light disabled:opacity-40 text-bg px-4 py-3 rounded-xl transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
