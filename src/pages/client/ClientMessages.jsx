import { useState, useEffect } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'

function msgTime(ts) {
  const d = parseISO(ts)
  if (isToday(d))     return format(d, 'h:mm a')
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
  return format(d, 'MMM d, h:mm a')
}

export default function ClientMessages() {
  const {
    activeClientId, messages, sendMessage, markMessagesRead,
    kayThreads, sendKayMessage, kayTyping,
  } = useStore()

  const [input,     setInput]     = useState('')
  const [kbHeight,  setKbHeight]  = useState(0)
  const [navH,      setNavH]      = useState(57)
  const [convo,     setConvo]     = useState('coach') // 'coach' | 'kay'

  const coachThread = messages[activeClientId] || []
  const kayThread   = kayThreads[activeClientId] || []

  // Measure nav bar height once
  useEffect(() => {
    const el = document.getElementById('client-bottom-nav')
    if (el) setNavH(el.offsetHeight)
  }, [])

  // Mark coach messages read on open / new message
  useEffect(() => {
    if (activeClientId) markMessagesRead(activeClientId, 'client')
  }, [activeClientId, coachThread.length])

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

  const handleSend = () => {
    if (!input.trim()) return
    if (convo === 'coach') {
      sendMessage(activeClientId, 'client', input.trim())
    } else {
      sendKayMessage(activeClientId, input.trim())
    }
    setInput('')
  }

  // Overlay shrinks above keyboard when it appears
  const overlayBottom = kbHeight > 0 ? `${kbHeight}px` : '0px'

  // 8px breathing room between input bar and the nav bar
  const inputPaddingBottom = kbHeight > 0 ? '12px' : `${navH + 8}px`

  const coachUnread = coachThread.filter((m) => m.from === 'coach' && !m.readByClient).length

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-bg z-10"
      style={{ bottom: overlayBottom }}
    >
      {/* Header */}
      <div
        className="px-5 pb-3 border-b border-border flex-shrink-0 anim-fade-in-down"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 68px)' }}
      >
        <h1 className="font-display font-black text-3xl tracking-wider text-cream">
          <ScrambleText text="MESSAGES" duration={750} />
        </h1>

        {/* Conversation selector */}
        <div className="flex gap-2 mt-3">
          {/* COACH tab */}
          <button
            onClick={() => setConvo('coach')}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-display font-bold text-xs tracking-widest transition-all ${
              convo === 'coach'
                ? 'bg-brown/20 border border-brown/40 text-brown-light'
                : 'bg-surface border border-border text-muted hover:text-cream'
            }`}
          >
            COACH
            {coachUnread > 0 && (
              <span className="w-4 h-4 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold">
                {coachUnread > 9 ? '9+' : coachUnread}
              </span>
            )}
          </button>

          {/* KAY tab */}
          <button
            onClick={() => setConvo('kay')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-display font-bold text-xs tracking-widest transition-all ${
              convo === 'kay'
                ? 'bg-olive/20 border border-olive/40 text-olive-light'
                : 'bg-surface border border-border text-muted hover:text-cream'
            }`}
          >
            <Sparkles size={11} />
            KAY
            <span className="font-mono text-[8px] text-dim font-normal normal-case tracking-normal">AI</span>
          </button>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col-reverse gap-4">

        {convo === 'coach' ? (
          coachThread.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <MessageCircle size={36} className="text-dim mb-3 anim-pop" />
              <p className="font-display font-bold text-xl text-muted tracking-widest">NO MESSAGES YET</p>
              <p className="font-mono text-xs text-dim mt-1.5">Your coach will reach out here</p>
            </div>
          ) : (
            [...coachThread].reverse().map((msg) => {
              const isClient = msg.from === 'client'
              return (
                <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'} anim-fade-in`}>
                  <div className={`max-w-[80%] flex flex-col gap-1 ${isClient ? 'items-end' : 'items-start'}`}>
                    {!isClient && (
                      <p className="font-display font-bold text-[10px] text-brown-light tracking-widest px-1 mb-0.5">
                        COACH
                      </p>
                    )}
                    <div className={`px-4 py-2.5 font-mono text-sm leading-relaxed ${
                      isClient
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
          )
        ) : (
          /* ── Kay thread ── */
          <>
            {/* Typing indicator — first in DOM = bottom of visual list */}
            {kayTyping && (
              <div className="flex justify-start anim-fade-in">
                <div className="flex flex-col gap-1 items-start">
                  <p className="font-display font-bold text-[10px] text-olive-light tracking-widest px-1 mb-0.5">
                    KAY PhD
                  </p>
                  <div className="px-4 py-3 bg-card border border-olive/20 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-olive-light animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-olive-light animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-olive-light animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {kayThread.length === 0 && !kayTyping ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-olive/15 border border-olive/25 flex items-center justify-center mb-4 anim-pop">
                  <Sparkles size={24} className="text-olive-light" />
                </div>
                <p className="font-display font-bold text-xl text-muted tracking-widest">MEET KAY</p>
                <p className="font-mono text-xs text-dim mt-2 max-w-[240px] leading-relaxed">
                  Your AI nutrition PhD. Ask about macros, meal timing, supplements, or anything food science.
                </p>
              </div>
            ) : (
              [...kayThread].reverse().map((msg) => {
                const isUser = msg.from === 'user'
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} anim-fade-in`}>
                    <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                      {!isUser && (
                        <p className="font-display font-bold text-[10px] text-olive-light tracking-widest px-1 mb-0.5">
                          KAY PhD
                        </p>
                      )}
                      <div className={`px-4 py-2.5 font-mono text-sm leading-relaxed ${
                        isUser
                          ? 'bg-brown text-bg rounded-2xl rounded-br-sm'
                          : 'bg-card border border-olive/20 text-cream rounded-2xl rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <p className="font-mono text-[10px] text-dim px-1">{msgTime(msg.timestamp)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-4 bg-surface border-t border-border"
        style={{ paddingTop: '12px', paddingBottom: inputPaddingBottom }}
      >
        <input
          type="text"
          placeholder={convo === 'coach' ? 'Message your coach…' : 'Ask Kay anything about nutrition…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={convo === 'kay' && kayTyping}
          className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 font-mono text-base text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || (convo === 'kay' && kayTyping)}
          className={`flex items-center justify-center disabled:opacity-40 text-bg px-4 py-3 rounded-xl transition-colors ${
            convo === 'kay' ? 'bg-olive hover:bg-olive-light' : 'bg-brown hover:bg-brown-light'
          }`}
        >
          {convo === 'kay' && kayTyping
            ? <Loader2 size={18} className="animate-spin" />
            : <Send size={18} />
          }
        </button>
      </div>
    </div>
  )
}
