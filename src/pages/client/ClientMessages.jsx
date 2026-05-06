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

export default function ClientMessages() {
  const { activeClientId, messages, sendMessage, markMessagesRead } = useStore()
  const [input, setInput]   = useState('')
  const [kbHeight, setKbHeight] = useState(0)
  // Measured height of the bottom nav element (includes safe-area padding)
  const [navH, setNavH]     = useState(57)

  const thread = messages[activeClientId] || []

  // Measure the nav bar once it's in the DOM
  useEffect(() => {
    const el = document.getElementById('client-bottom-nav')
    if (el) setNavH(el.offsetHeight)
  }, [])

  // Mark messages read on open / new message
  useEffect(() => {
    if (activeClientId) markMessagesRead(activeClientId, 'client')
  }, [activeClientId, thread.length])

  // Track software keyboard height via visualViewport (iOS + Android)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
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

  // Overlay shrinks to sit above the keyboard when it appears.
  // When keyboard is hidden bottom=0 (full screen); the BottomNav (z-20) renders
  // on top of us and the input bar's paddingBottom creates the flush clearance.
  const overlayBottom = kbHeight > 0 ? `${kbHeight}px` : '0px'

  // Input bar bottom padding:
  //   keyboard hidden → clear exactly the measured nav height (flush)
  //   keyboard shown  → just 12px breathing room above keyboard
  const inputPaddingBottom = kbHeight > 0 ? '12px' : `${navH}px`

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-bg z-10"
      style={{ bottom: overlayBottom }}
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
          // Newest first in DOM; flex-col-reverse flips it so newest appears at bottom
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

      {/* Input bar — flush against nav (keyboard hidden) or keyboard (keyboard shown) */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-4 bg-surface border-t border-border"
        style={{ paddingTop: '12px', paddingBottom: inputPaddingBottom }}
      >
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
