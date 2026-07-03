import { useState, useEffect, useRef, useMemo } from 'react'
import { MessageCircle, UserCircle2, Lock } from 'lucide-react'
import useStore from '../../store'
import useSubscription from '../../hooks/useSubscription'
import { tapHaptic } from '../../utils/haptics'
import {
  accentA, buildThread, lastSeenSelfId, DaySep, Bubble, Composer,
} from '../../components/ChatKit'

export default function ClientMessages() {
  const {
    activeClientId, clients, messages, sendMessage, markMessagesRead,
    setNavHidden, setActivePage, coachProfile, loadCoachProfile,
  } = useStore()
  const { hasAccess } = useSubscription()
  // Messaging your coach is a premium feature: it requires a linked coach AND
  // an active subscription (or a superadmin unlock).
  const myCoachId = clients.find((c) => c.id === activeClientId)?.coachId
  const hasCoach  = !!myCoachId

  // Show the coach's real name in the header once their profile is loaded
  useEffect(() => {
    if (myCoachId && !coachProfile) loadCoachProfile(myCoachId)
  }, [myCoachId]) // eslint-disable-line react-hooks/exhaustive-deps
  const coachName  = coachProfile?.name || 'Coach'
  const coachFirst = coachName.split(' ')[0]

  const [kbHeight, setKbHeight] = useState(0)
  const [navH,     setNavH]     = useState(57)
  const inputRef = useRef(null)

  const thread = messages[activeClientId] || []
  const threadItems = useMemo(() => buildThread(thread).reverse(), [thread])
  const seenId      = useMemo(() => lastSeenSelfId(thread, 'client'), [thread])

  // Drive keyboard-dependent layout off the measured keyboard height only.
  // Using focus as a fallback made the nav stay hidden after the keyboard was
  // minimized (input keeps focus but the keyboard is down).
  const kbActive = kbHeight > 0

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

  const overlayBottom      = kbHeight > 0 ? `${kbHeight}px` : '0px'
  const inputPaddingBottom = kbActive ? '12px' : `${navH + 8}px`

  // Messaging unlocks once you're linked to a coach (via coach code).
  if (!hasCoach) {
    return (
      <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col bg-bg z-10">
        <div className="px-5 pt-mobile-header pb-4 border-b border-border flex-shrink-0 glass-panel accent-line">
          <h1 className="font-display font-black text-2xl tracking-[0.15em] text-cream leading-none">COACH</h1>
          <p className="font-mono text-xs text-muted mt-1">Direct line to your coach</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 anim-fade-in">
          <MessageCircle size={36} className="text-dim mb-3 anim-pop" />
          <p className="font-display font-bold text-xl text-muted tracking-widest">NOT CONNECTED YET</p>
          <p className="font-mono text-sm text-dim mt-2 max-w-xs leading-relaxed">
            Enter your coach code under Profile → Link to Coach to start messaging your coach.
          </p>
          <button
            onClick={() => setActivePage('profile')}
            className="mt-6 px-5 py-2.5 rounded-xl border border-border text-cream font-display font-bold text-xs tracking-widest hover:border-muted transition-colors press"
          >
            ENTER COACH CODE
          </button>
        </div>
      </div>
    )
  }

  // Coach chatting is locked behind the paywall (Pro subscription / unlock).
  if (!hasAccess) {
    return (
      <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col bg-bg z-10">
        <div className="px-5 pt-mobile-header pb-4 border-b border-border flex-shrink-0 glass-panel accent-line">
          <h1 className="font-display font-black text-2xl tracking-[0.15em] text-cream leading-none">COACH</h1>
          <p className="font-mono text-xs text-muted mt-1">Direct line to your coach</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 anim-fade-in">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 anim-pop"
            style={{ background: accentA(12), border: `1px solid ${accentA(28)}` }}
          >
            <Lock size={22} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-px" style={{ background: accentA(50) }} />
            <p className="font-mono text-[10px] tracking-[0.22em] text-muted">PREMIUM</p>
            <span className="w-5 h-px" style={{ background: accentA(50) }} />
          </div>
          <p className="font-display font-black text-xl text-cream tracking-widest">MESSAGE YOUR COACH</p>
          <p className="font-mono text-sm text-dim mt-2 max-w-xs leading-relaxed">
            Direct coach messaging is part of MacroStack Pro. Upgrade to start the conversation.
          </p>
          <button
            onClick={() => setActivePage('upgrade')}
            className="mt-6 btn-accent font-display font-bold text-sm tracking-widest px-6 py-3 rounded-xl glow-hover press"
          >
            UNLOCK WITH PREMIUM
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-bg z-10"
      style={{ bottom: overlayBottom }}
    >
      {/* Header — the coach's real identity */}
      <div className="flex items-center gap-3 px-5 pt-mobile-header pb-4 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-display font-black text-base"
          style={{ background: accentA(14), border: `1px solid ${accentA(32)}`, color: 'var(--color-accent)' }}
        >
          {coachProfile?.name ? coachName.charAt(0).toUpperCase() : <UserCircle2 size={20} />}
        </div>
        <div className="min-w-0">
          <h1 className="font-display font-black text-2xl tracking-[0.12em] text-cream leading-none truncate uppercase">
            {coachName}
          </h1>
          <p className="font-mono text-xs text-muted mt-1">Your coach · direct line</p>
        </div>
      </div>

      {/* Messages — flex-col-reverse anchors newest at bottom */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col-reverse">
        {threadItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageCircle size={36} className="text-dim mb-3 anim-pop" />
            <p className="font-display font-bold text-xl text-muted tracking-widest">NO MESSAGES YET</p>
            <p className="font-mono text-xs text-dim mt-1.5">
              Say hi to {coachFirst} — they'll get a notification
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
                isSelf={item.msg.from === 'client'}
                first={item.first}
                last={item.last}
                seen={item.msg.id === seenId}
                senderLabel={coachFirst.toUpperCase()}
                maxW="max-w-[80%]"
              />
            )
          )
        )}
      </div>

      {/* Composer */}
      <div
        className="flex-shrink-0 px-4 glass-panel border-t border-border"
        style={{ paddingTop: '12px', paddingBottom: inputPaddingBottom }}
      >
        <Composer
          clientId={activeClientId}
          placeholder={`Message ${coachFirst}…`}
          textSize="text-base"
          inputRef={inputRef}
          onInputBlur={() => setKbHeight(0)}
          onSendText={(text) => { sendMessage(activeClientId, 'client', text); tapHaptic() }}
          onSendAttachment={(att) => sendMessage(activeClientId, 'client', '', att)}
        />
      </div>
    </div>
  )
}
