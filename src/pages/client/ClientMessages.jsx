import { useState, useEffect } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { MessageCircle, Send, UserCircle2 } from 'lucide-react'
import useStore from '../../store'
import { tapHaptic } from '../../utils/haptics'

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

export default function ClientMessages() {
  const {
    activeClientId, messages, sendMessage, markMessagesRead,
    setNavHidden,
  } = useStore()

  const [input,        setInput]        = useState('')
  const [kbHeight,     setKbHeight]     = useState(0)
  const [navH,         setNavH]         = useState(57)
  const [inputFocused, setInputFocused] = useState(false)

  const thread = messages[activeClientId] || []

  // Keyboard is "active" when it's physically up (iOS) or input is focused (Android).
  const kbActive = kbHeight > 0 || inputFocused

  // Measure nav bar height once
  useEffect(() => {
    const el = document.getElementById('client-bottom-nav')
    if (el) setNavH(el.offsetHeight)
  }, [])

  // Mark coach messages read while the thread is open
  useEffect(() => {
    if (activeClientId) markMessagesRead(activeClientId, 'client')
  }, [activeClientId, thread.length])

  // Track software keyboard height (iOS + Android)
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

  // Hide the bottom nav while the keyboard is open so the composer sits
  // directly above the keyboard instead of floating over the nav.
  useEffect(() => {
    setNavHidden(kbActive)
    return () => setNavHidden(false)
  }, [kbActive])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(activeClientId, 'client', input.trim())
    tapHaptic()
    setInput('')
  }

  const overlayBottom      = kbHeight > 0 ? `${kbHeight}px` : '0px'
  const inputPaddingBottom = kbActive ? '12px' : `${navH + 8}px`

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-bg z-10"
      style={{ bottom: overlayBottom }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-mobile-header pb-4 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div className="w-10 h-10 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
          <UserCircle2 size={20} className="text-brown-light" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl tracking-[0.15em] text-cream leading-none">COACH</h1>
          <p className="font-mono text-xs text-muted mt-1">Direct line to your coach</p>
        </div>
      </div>

      {/* Messages — flex-col-reverse anchors newest at bottom */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col-reverse gap-4">
        {thread.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageCircle size={36} className="text-dim mb-3 anim-pop" />
            <p className="font-display font-bold text-xl text-muted tracking-widest">NO MESSAGES YET</p>
            <p className="font-mono text-xs text-dim mt-1.5">Your coach will reach out here</p>
          </div>
        ) : (
          [...thread].reverse().map((msg) => {
            const isSelf = msg.from === 'client'
            return (
              <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} anim-fade-in`}>
                <div className={`max-w-[80%] flex flex-col gap-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                  {!isSelf && (
                    <p className="font-display font-bold text-[10px] tracking-widest px-1 mb-0.5 text-brown-light">
                      COACH
                    </p>
                  )}
                  <div className={`px-4 py-1.5 font-mono text-sm leading-relaxed tracking-tight ${
                    isSelf
                      ? 'bg-brown text-bg rounded-2xl rounded-br-sm'
                      : 'bg-card border border-border text-cream rounded-2xl rounded-bl-sm'
                  }`}>
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
      <div
        className="flex-shrink-0 flex items-center gap-2 px-4 glass-panel border-t border-border"
        style={{ paddingTop: '12px', paddingBottom: inputPaddingBottom }}
      >
        <input
          type="text"
          placeholder="Message your coach…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          className="flex-1 min-w-0 bg-bg border border-border rounded-xl px-4 py-3 font-mono text-base text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex-shrink-0 flex items-center justify-center px-4 py-3 rounded-xl transition-colors bg-brown hover:bg-brown-light disabled:opacity-40 text-bg"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
