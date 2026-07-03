import { useState, useRef, useEffect } from 'react'
import { format, parseISO, isToday, isYesterday, differenceInMinutes } from 'date-fns'
import { Send, Zap, X } from 'lucide-react'
import useStore from '../store'
import { AttachmentButtons, MessageAttachment } from './ChatAttachments'

/* ── ChatKit — shared premium chat primitives ─────────────────────────────────
   Used by CoachChat (desktop), MobileChat (coach mobile) and ClientMessages
   (user app) so every chat surface gets the same treatment:
   - iMessage-style grouping of consecutive same-sender messages (<6 min apart)
   - day separator pills
   - gradient self bubbles + glass incoming bubbles with grouped corner radii
   - "Seen" read receipt on your latest read message
   - auto-growing composer with Enter-to-send and quick-reply templates       */

export const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

export function msgTime(ts) {
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

export function dayLabel(ts) {
  try {
    const d = parseISO(ts)
    if (isNaN(d.getTime())) return null
    if (isToday(d))     return 'TODAY'
    if (isYesterday(d)) return 'YESTERDAY'
    return format(d, 'MMM d, yyyy').toUpperCase()
  } catch {
    return null
  }
}

/* One-line thread preview for roster/inbox lists (handles attachment-only msgs) */
export function msgPreview(msg) {
  if (!msg) return ''
  if (msg.text) return msg.text
  if (msg.attachmentType === 'audio') return '🎤 Voice note'
  if (msg.attachmentType === 'image') return '📷 Photo'
  return ''
}

const closeInTime = (a, b) => {
  try {
    return Math.abs(differenceInMinutes(parseISO(b.timestamp), parseISO(a.timestamp))) < 6
  } catch {
    return false
  }
}

/* Build render items (oldest → newest): day separators + per-message group
   flags. `first`/`last` mark the message's position within its sender-group. */
export function buildThread(thread) {
  const items = []
  let lastDay = null
  for (let i = 0; i < thread.length; i++) {
    const msg  = thread[i]
    const prev = thread[i - 1]
    const next = thread[i + 1]
    const label  = dayLabel(msg.timestamp)
    const newDay = label && label !== lastDay
    if (newDay) {
      items.push({ type: 'sep', id: `sep-${label}-${msg.id}`, label })
      lastDay = label
    }
    const sameAsPrev = !newDay && prev && prev.from === msg.from && closeInTime(prev, msg)
    const nextSameDay = next && dayLabel(next.timestamp) === label
    const sameAsNext  = next && nextSameDay && next.from === msg.from && closeInTime(msg, next)
    items.push({ type: 'msg', id: msg.id, msg, first: !sameAsPrev, last: !sameAsNext })
  }
  return items
}

export function DaySep({ label }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span
        className="px-3.5 py-1 rounded-full font-mono text-[9px] tracking-[0.25em] text-dim border border-border"
        style={{ background: 'color-mix(in srgb, var(--color-surface) 70%, transparent)' }}
      >
        {label}
      </span>
    </div>
  )
}

/* A single message row. Corners tighten inside a group; timestamp + "Seen"
   render only on the last message of a group. `avatar` (a node) is shown
   beside the last incoming bubble of each group. */
export function Bubble({ msg, isSelf, first, last, avatar, senderLabel, seen, maxW = 'max-w-[72%]' }) {
  const corners = isSelf
    ? `rounded-2xl ${last ? 'rounded-br-sm' : 'rounded-br-lg'} ${!first ? 'rounded-tr-lg' : ''}`
    : `rounded-2xl ${last ? 'rounded-bl-sm' : 'rounded-bl-lg'} ${!first ? 'rounded-tl-lg' : ''}`

  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} anim-fade-in ${first ? 'mt-3' : 'mt-1'}`}>
      {!isSelf && avatar !== undefined && (
        <div className={`w-8 flex-shrink-0 self-end mr-1.5 ${last ? 'mb-5' : ''}`}>
          {last ? avatar : null}
        </div>
      )}
      <div className={`${maxW} flex flex-col gap-1 ${isSelf ? 'items-end' : 'items-start'}`}>
        {first && !isSelf && senderLabel && (
          <p className="font-display font-bold text-[10px] tracking-widest px-1 text-brown-light">
            {senderLabel}
          </p>
        )}
        <div
          className={`px-4 py-2 font-mono text-sm leading-relaxed tracking-tight break-words ${corners} ${
            isSelf ? '' : 'glass-card border border-border text-cream'
          }`}
          style={isSelf ? {
            background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 72%, white))',
            color: '#fff',
            boxShadow: `0 4px 16px ${accentA(20)}`,
          } : undefined}
        >
          {msg.text}
          <MessageAttachment url={msg.attachmentUrl} type={msg.attachmentType} />
        </div>
        {last && (
          <p className="font-mono text-[10px] text-dim px-1 flex items-center gap-1.5">
            {msgTime(msg.timestamp)}
            {seen && (
              <span className="flex items-center gap-0.5 font-semibold" style={{ color: 'var(--color-accent)' }}>
                · Seen
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

/* Find the id of your newest message that the other side has read —
   the classic single "Seen" receipt spot. */
export function lastSeenSelfId(thread, selfFrom) {
  for (let i = thread.length - 1; i >= 0; i--) {
    const m = thread[i]
    if (m.from !== selfFrom) continue
    const read = selfFrom === 'coach' ? m.readByClient : m.readByCoach
    return read ? m.id : null
  }
  return null
}

/* Quick-reply popover — saved message_templates, insert-on-tap. Coach only. */
function QuickReplies({ onPick, onClose }) {
  const templates = useStore((s) => s.messageTemplates)
  const fetchMessageTemplates = useStore((s) => s.fetchMessageTemplates)

  useEffect(() => {
    if (templates === null) fetchMessageTemplates()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-30 anim-fade-in-up">
      <div className="glass-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap size={12} style={{ color: 'var(--color-accent)' }} />
            <p className="font-display font-bold text-[10px] tracking-[0.2em] text-muted">QUICK REPLIES</p>
          </div>
          <button onClick={onClose} className="text-dim hover:text-cream transition-colors p-1">
            <X size={13} />
          </button>
        </div>
        <div className="max-h-56 overflow-y-auto p-2 space-y-1">
          {(templates || []).length === 0 ? (
            <p className="font-mono text-xs text-dim px-3 py-4 text-center leading-relaxed">
              No saved templates yet.<br />Create them from Dashboard → MESSAGE USERS.
            </p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onPick(t.body)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <p className="font-display font-bold text-xs text-cream tracking-wide">{t.title}</p>
                <p className="font-mono text-[11px] text-muted mt-0.5 line-clamp-2">{t.body}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* Premium composer — auto-growing textarea, Enter to send (Shift+Enter for a
   newline), attachment buttons, optional quick-reply templates. Keeps focus
   after sending so mobile keyboards stay up. */
export function Composer({
  clientId,
  onSendText,
  onSendAttachment,
  placeholder = 'Message…',
  templates = false,
  inputRef = null,
  onInputBlur,
  textSize = 'text-sm',
}) {
  const [input, setInput]     = useState('')
  const [showTpl, setShowTpl] = useState(false)
  const innerRef = useRef(null)
  const taRef = inputRef || innerRef

  const resize = () => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  const send = () => {
    const text = input.trim()
    if (!text) return
    onSendText(text)
    setInput('')
    requestAnimationFrame(() => {
      const el = taRef.current
      if (el) { el.style.height = 'auto'; el.focus() }
    })
  }

  return (
    <div className="relative flex items-end gap-2 w-full">
      {showTpl && (
        <QuickReplies
          onClose={() => setShowTpl(false)}
          onPick={(body) => {
            setInput((v) => (v ? `${v} ${body}` : body))
            setShowTpl(false)
            requestAnimationFrame(() => { resize(); taRef.current?.focus() })
          }}
        />
      )}

      <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
        <AttachmentButtons clientId={clientId} onSend={onSendAttachment} />
        {templates && (
          <button
            type="button"
            onClick={() => setShowTpl((v) => !v)}
            title="Quick replies"
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl border transition-colors"
            style={showTpl
              ? { borderColor: accentA(45), color: 'var(--color-accent)', background: accentA(10) }
              : { borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            <Zap size={15} />
          </button>
        )}
      </div>

      <textarea
        ref={taRef}
        rows={1}
        placeholder={placeholder}
        value={input}
        onChange={(e) => { setInput(e.target.value); resize() }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
        }}
        onBlur={onInputBlur}
        className={`flex-1 min-w-0 bg-bg border border-border rounded-2xl px-4 py-3 font-mono ${textSize} text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 transition-colors resize-none leading-snug`}
        style={{ maxHeight: 128 }}
      />

      <button
        onClick={send}
        onMouseDown={(e) => e.preventDefault()}
        disabled={!input.trim()}
        title="Send"
        className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all disabled:opacity-35 press"
        style={{
          background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 72%, white))',
          color: '#fff',
          boxShadow: `0 4px 14px ${accentA(28)}`,
        }}
      >
        <Send size={16} />
      </button>
    </div>
  )
}
