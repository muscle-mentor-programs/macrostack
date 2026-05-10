import { useState, useEffect } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { MessageCircle, Send, Loader2, Sparkles, ChevronLeft, UserCircle2 } from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'

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

function previewText(msg, isKay = false) {
  if (!msg) return isKay ? 'Ask anything about nutrition…' : 'No messages yet'
  if (isKay) return msg.from === 'user' ? `You: ${msg.text}` : msg.text
  return msg.from === 'coach' ? `Coach: ${msg.text}` : `You: ${msg.text}`
}

export default function ClientMessages() {
  const {
    activeClientId, messages, sendMessage, markMessagesRead,
    kayThreads, sendKayMessage, kayTyping,
    setNavHidden,
  } = useStore()

  const [input,        setInput]        = useState('')
  const [kbHeight,     setKbHeight]     = useState(0)
  const [navH,         setNavH]         = useState(57)
  const [inputFocused, setInputFocused] = useState(false)
  // null = list view, 'coach' | 'kay' = thread view
  const [openThread, setOpenThread] = useState(null)

  const coachThread = messages[activeClientId] || []
  const kayThread   = kayThreads[activeClientId] || []

  // Keyboard is "active" when it's physically up (iOS) or input is focused (Android).
  // Must be declared before any useEffect that references it.
  const kbActive           = kbHeight > 0 || inputFocused

  // Measure nav bar height once
  useEffect(() => {
    const el = document.getElementById('client-bottom-nav')
    if (el) setNavH(el.offsetHeight)
  }, [])

  // Mark coach messages read when coach thread is open
  useEffect(() => {
    if (activeClientId && openThread === 'coach') {
      markMessagesRead(activeClientId, 'client')
    }
  }, [activeClientId, openThread, coachThread.length])

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

  // Hide the bottom nav while the keyboard is open inside a chat thread.
  // z-index doesn't work reliably across stacking contexts, so we slide
  // the nav out of view instead and restore it on cleanup.
  useEffect(() => {
    const shouldHide = kbActive && openThread !== null
    setNavHidden(shouldHide)
    return () => setNavHidden(false) // restore when unmounting (page change)
  }, [kbActive, openThread])

  const handleSend = () => {
    if (!input.trim()) return
    if (openThread === 'coach') {
      sendMessage(activeClientId, 'client', input.trim())
    } else if (openThread === 'kay') {
      sendKayMessage(activeClientId, input.trim())
    }
    setInput('')
  }
  const overlayBottom      = kbHeight > 0 ? `${kbHeight}px` : '0px'
  const inputPaddingBottom = kbActive ? '12px' : `${navH + 8}px`

  const coachUnread  = coachThread.filter((m) => m.from === 'coach' && !m.readByClient).length
  const coachLastMsg = coachThread[coachThread.length - 1] || null
  const kayLastMsg   = kayThread[kayThread.length - 1] || null

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  if (openThread === null) {
    return (
      <div
        className="fixed inset-x-0 top-0 flex flex-col bg-bg z-10"
        style={{ bottom: '0px' }}
      >
        {/* Header */}
        <div
          className="px-5 pb-4 border-b border-border flex-shrink-0 anim-fade-in-down"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 68px)' }}
        >
          <h1 className="font-display font-black text-3xl tracking-wider text-cream">
            <ScrambleText text="MESSAGES" duration={750} />
          </h1>
          <p className="font-mono text-xs text-muted mt-1">Your conversations</p>
        </div>

        {/* Conversation cards */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-3"
          style={{ paddingBottom: `${navH + 8}px` }}
        >
          {/* Coach card */}
          <button
            onClick={() => setOpenThread('coach')}
            className="w-full bg-card border border-border hover:border-brown/40 rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:bg-surface anim-fade-in-up"
            style={{ animationDelay: '60ms' }}
          >
            <div className="w-12 h-12 rounded-full bg-brown/20 border border-brown/30 flex items-center justify-center flex-shrink-0">
              <UserCircle2 size={22} className="text-brown-light" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-display font-bold text-sm text-cream tracking-wide">COACH</p>
                {coachLastMsg && (
                  <p className="font-mono text-[10px] text-dim">{msgTime(coachLastMsg.timestamp)}</p>
                )}
              </div>
              <p className={`font-mono text-xs truncate ${coachUnread > 0 ? 'text-cream' : 'text-muted'}`}>
                {previewText(coachLastMsg)}
              </p>
            </div>
            {coachUnread > 0 && (
              <span className="w-5 h-5 rounded-full bg-brown flex items-center justify-center font-mono text-[9px] text-bg font-bold flex-shrink-0">
                {coachUnread > 9 ? '9+' : coachUnread}
              </span>
            )}
          </button>

          {/* Kay card */}
          <button
            onClick={() => setOpenThread('kay')}
            className="w-full bg-card border border-border hover:border-olive/40 rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:bg-surface anim-fade-in-up"
            style={{ animationDelay: '120ms' }}
          >
            <div className="w-12 h-12 rounded-full bg-olive/20 border border-olive/30 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-olive-light" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold text-sm text-cream tracking-wide">KAY</p>
                  <span className="font-mono text-[8px] text-olive-light bg-olive/15 border border-olive/25 px-1.5 py-0.5 rounded tracking-widest">AI</span>
                </div>
                {kayLastMsg && (
                  <p className="font-mono text-[10px] text-dim">{msgTime(kayLastMsg.timestamp)}</p>
                )}
              </div>
              <p className="font-mono text-xs text-muted truncate">
                {kayLastMsg ? previewText(kayLastMsg, true) : 'PhD Nutrition Science · Ask me anything'}
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── THREAD VIEW ─────────────────────────────────────────────────────────────
  const isKay        = openThread === 'kay'
  const activeThread = isKay ? kayThread : coachThread
  const accentActive = isKay ? 'text-olive-light' : 'text-brown-light'
  const sendBtnCls   = isKay
    ? 'bg-olive hover:bg-olive-light disabled:opacity-40 text-bg'
    : 'bg-brown hover:bg-brown-light disabled:opacity-40 text-bg'

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-bg z-30 anim-slide-right"
      style={{ bottom: overlayBottom }}
    >
      {/* Thread header */}
      <div
        className="flex items-center gap-3 px-4 pb-4 border-b border-border flex-shrink-0 anim-fade-in-down"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 68px)' }}
      >
        <button
          onClick={() => { setOpenThread(null); setInput(''); setInputFocused(false) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-cream hover:bg-card transition-colors flex-shrink-0"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isKay ? 'bg-olive/20 border border-olive/30' : 'bg-brown/20 border border-brown/30'
        }`}>
          {isKay
            ? <Sparkles size={16} className="text-olive-light" />
            : <UserCircle2 size={18} className="text-brown-light" />
          }
        </div>

        {/* Name */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display font-bold text-base text-cream">
              {isKay ? 'KAY' : 'COACH'}
            </p>
            {isKay && (
              <span className="font-mono text-[8px] text-olive-light bg-olive/15 border border-olive/25 px-1.5 py-0.5 rounded tracking-widest">AI</span>
            )}
          </div>
          <p className="font-mono text-xs text-muted">
            {isKay ? 'PhD Nutrition Science' : 'Your coach'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col-reverse gap-4">
        {/* Kay typing indicator */}
        {isKay && kayTyping && (
          <div className="flex justify-start anim-fade-in">
            <div className="flex flex-col gap-1 items-start">
              <p className={`font-display font-bold text-[10px] tracking-widest px-1 mb-0.5 ${accentActive}`}>
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

        {activeThread.length === 0 && !(isKay && kayTyping) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {isKay ? (
              <>
                <div className="w-14 h-14 rounded-full bg-olive/15 border border-olive/25 flex items-center justify-center mb-4 anim-pop">
                  <Sparkles size={24} className="text-olive-light" />
                </div>
                <p className="font-display font-bold text-xl text-muted tracking-widest">MEET KAY</p>
                <p className="font-mono text-xs text-dim mt-2 max-w-[240px] leading-relaxed">
                  Your AI nutrition PhD. Ask about macros, meal timing, supplements, or any food science question.
                </p>
              </>
            ) : (
              <>
                <MessageCircle size={36} className="text-dim mb-3 anim-pop" />
                <p className="font-display font-bold text-xl text-muted tracking-widest">NO MESSAGES YET</p>
                <p className="font-mono text-xs text-dim mt-1.5">Your coach will reach out here</p>
              </>
            )}
          </div>
        ) : (
          [...activeThread].reverse().map((msg) => {
            const isSelf = msg.from === 'client' || msg.from === 'user'
            const senderLabel = isKay ? 'KAY PhD' : 'COACH'
            return (
              <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} anim-fade-in`}>
                <div className={`max-w-[80%] flex flex-col gap-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                  {!isSelf && (
                    <p className={`font-display font-bold text-[10px] tracking-widest px-1 mb-0.5 ${accentActive}`}>
                      {senderLabel}
                    </p>
                  )}
                  <div className={`px-4 py-2.5 font-mono text-sm leading-relaxed ${
                    isSelf
                      ? 'bg-brown text-bg rounded-2xl rounded-br-sm'
                      : isKay
                        ? 'bg-card border border-olive/20 text-cream rounded-2xl rounded-bl-sm'
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
        className="flex-shrink-0 flex items-center gap-2 px-4 bg-surface border-t border-border"
        style={{ paddingTop: '12px', paddingBottom: inputPaddingBottom }}
      >
        <input
          type="text"
          placeholder={isKay ? 'Ask Kay anything about nutrition…' : 'Message your coach…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          disabled={isKay && kayTyping}
          className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 font-mono text-base text-cream placeholder-muted focus:outline-none focus:border-brown transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || (isKay && kayTyping)}
          className={`flex items-center justify-center px-4 py-3 rounded-xl transition-colors ${sendBtnCls}`}
        >
          {isKay && kayTyping
            ? <Loader2 size={18} className="animate-spin" />
            : <Send size={18} />
          }
        </button>
      </div>
    </div>
  )
}
