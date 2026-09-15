import BrandWordmark from '../components/BrandWordmark'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useState, useLayoutEffect, useRef } from 'react'
import { ArrowUpRight, Check, ScanBarcode, ChartNoAxesCombined, Users, MessageSquare, ClipboardList, ChevronRight } from 'lucide-react'
import './Gyms.css'

gsap.registerPlugin(ScrollTrigger)

const tiers = [
  { label: 'Up to 250', price: 299 },
  { label: '251–500', price: 499 },
  { label: '501–1,000', price: 799 },
  { label: '1,001–2,500', price: 1299 },
  { label: 'Over 2,500', price: null },
]
const money = value => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })

export default function Gyms() {
  const rootRef = useRef(null)
  useLayoutEffect(() => {
    const mm = gsap.matchMedia(rootRef.current)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(rootRef.current)
      gsap.from(q('.gym-hero-word'), { yPercent: 110, duration: 1, stagger: .12, ease: 'power4.out' })
      gsap.from(q('.gyms-intro, .gyms-actions'), { y: 28, opacity: 0, duration: 1, stagger: .14, delay: .3 })
      q('.gyms-section h2, .gyms-benefits article, .gyms-onboarding h2, .gyms-steps article, .gyms-faq h2').forEach(el => {
        gsap.from(el, { y: 32, opacity: 0, duration: .75, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } })
      })
    })
    return () => mm.revert()
  }, [])
  const [tier, setTier] = useState(0)
  const [annual, setAnnual] = useState(false)
  const [draft, setDraft] = useState(null)
  const selected = tiers[tier]
  const price = selected.price == null ? null : Math.round(selected.price * (annual ? 0.8 : 1) * 100) / 100
  useEffect(() => {
    document.documentElement.classList.add('landing-mode')
    ScrollTrigger.refresh()
    const title = document.title
    document.title = 'Macrostack for Gyms | Pro for Members. Tools for Trainers.'
    return () => { document.title = title; document.documentElement.classList.remove('landing-mode') }
  }, [])
  function prepareInquiry(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const body = `Hi Macrostack,\n\nI'd like to discuss Macrostack for our gym.\n\nGym: ${data.get('gym')}\nContact: ${data.get('name')}\nEmail: ${data.get('email')}\nMembers: ${selected.label}\nPlan: ${annual ? 'One-year commitment (20% discount)' : 'Monthly'}\n${price == null ? 'Custom pricing requested' : `Estimated monthly price: ${money(price)}`}\n\n${data.get('message') || ''}`
    setDraft(`mailto:getmacrostack@gmail.com?subject=${encodeURIComponent('Macrostack for Gyms — ' + data.get('gym'))}&body=${encodeURIComponent(body)}`)
  }
  return <div ref={rootRef} className="gyms-page">
    <a className="gyms-skip" href="#gym-content">Skip to content</a>
    <header className="gyms-nav"><a href="/" className="gyms-brand"><img src="/macrostack-mark-light-shadow.png" alt="" /><BrandWordmark /><small>FOR GYMS</small></a><nav aria-label="Gym navigation"><a href="#gym-pricing">Pricing</a><a className="gyms-nav-cta" href="#gym-contact">Let’s talk <ArrowUpRight size={16} /></a></nav></header>
    <main id="gym-content">
      <section className="gyms-hero gyms-wrap">
        <div><p className="gyms-eyebrow">YOUR FACILITY. THEIR NEXT LEVEL.</p><h1>{['A STRONGER', 'MEMBERSHIP.', 'BUILT IN.'].map((line, i) => <span className="gym-hero-line" key={line}><span className={`gym-hero-word${i === 2 ? ' gym-hero-accent' : ''}`}>{line}</span></span>)}</h1><p className="gyms-intro">Give every member Macrostack Pro. Give every trainer the tools to coach unlimited clients. One monthly plan for your gym.</p><div className="gyms-actions"><a className="gyms-button" href="#gym-pricing">Find your gym’s plan <ArrowUpRight size={19} /></a><a href="#gym-benefits">Explore the benefits <ChevronRight size={16} /></a></div><p className="gyms-fine">From $299/month · Pro for members · Unlimited clients for trainers</p></div>
        <div className="gyms-visual"><div className="gyms-orbit" /><img className="gyms-phone gyms-phone-back" src="/mockups/coach-dashboard.png" alt="Macrostack trainer dashboard showing client activity" /><img className="gyms-phone gyms-phone-front" src="/mockups/app-weight.png" alt="Macrostack member bodyweight trends and moving average" /><div className="gyms-access"><span className="gyms-status" /> ONE GYM. EVERY MEMBER.<strong>PRO ACCESS INCLUDED</strong></div></div>
      </section>
      <div className="gyms-strip"><span>MEMBER NUTRITION</span><span>TRAINER TOOLS</span><span>ONE FACILITY PLAN</span></div>
      <section id="gym-benefits" className="gyms-wrap gyms-section"><p className="gyms-eyebrow">TWO SIDES. ONE PLATFORM.</p><h2>MORE FOR YOUR MEMBERS.<br /><span>MORE FROM YOUR COACHING.</span></h2><div className="gyms-benefits">
        <article><span className="gyms-tag">FOR EVERY MEMBER</span><h3>THEIR GOALS.<br />PRO TOOLS.</h3><p>Make nutrition support part of the membership experience, inside an app they can use every day.</p><Benefit icon={ScanBarcode} title="Scan. Log. Keep moving." text="Barcode scanning and a shared food database make everyday food logging easier." /><Benefit icon={ChartNoAxesCombined} title="See the bigger picture." text="Advanced nutrition analytics and bodyweight trends help members understand their progress." /><Benefit icon={Check} title="Their own Pro account." text="Each member gets their own food log, goals, and progress history." /></article>
        <article><span className="gyms-tag">FOR YOUR TRAINERS</span><h3>COACH EVERY CLIENT.<br />WITHOUT THE CAP.</h3><p>Your facility’s trainers receive the top coach edition, with unlimited client capacity.</p><Benefit icon={Users} title="Room for the whole roster." text="Onboard clients, set calorie and macro goals, and review food journals." /><Benefit icon={MessageSquare} title="Keep coaching connected." text="Direct client messaging, meal plans, notes, and tasks in one place." /><Benefit icon={ClipboardList} title="Build a consistent routine." text="Questionnaires, custom forms, and weekly check-ins support ongoing coaching." /></article>
      </div><p className="gyms-note">Coaching is provided by your facility’s trainers. Your gym plan includes access to Macrostack’s software.</p></section>
      <section className="gyms-onboarding"><div className="gyms-wrap"><p className="gyms-eyebrow">LET’S GET YOUR GYM STARTED</p><h2>ONE CONVERSATION.<br />A PLAN FOR YOUR FACILITY.</h2><div className="gyms-steps">{[['01','Tell us about your gym','We’ll review your membership size and how your trainers work.'],['02','Confirm your plan','Choose a monthly plan or a one-year commitment with 20% off.'],['03','Plan your rollout','We’ll coordinate setup and member onboarding with your team.']].map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></div></section>
      <section id="gym-pricing" className="gyms-wrap gyms-section"><p className="gyms-eyebrow">ONE PLAN. YOUR WHOLE GYM.</p><h2>PRICED FOR<br /><span>YOUR MEMBERSHIP.</span></h2><div className="gyms-pricing"><div><label htmlFor="gym-size">Total gym members</label><select id="gym-size" value={tier} onChange={e=>{setTier(Number(e.target.value));setDraft(null)}}>{tiers.map((t,i)=><option key={t.label} value={i}>{t.label} members</option>)}</select><div className="gyms-billing" role="group" aria-label="Contract length"><button aria-pressed={!annual} onClick={()=>{setAnnual(false);setDraft(null)}}>Monthly</button><button aria-pressed={annual} onClick={()=>{setAnnual(true);setDraft(null)}}>One year <span>−20%</span></button></div><p className="gyms-fine">Based on your gym’s total membership, not the number of app activations. All prices in USD.</p><ul className="gyms-included">{['Pro access for every gym member','Top coach edition for facility trainers','Unlimited clients per trainer'].map(t=><li key={t}><Check size={18}/>{t}</li>)}</ul></div><div className="gyms-price-card"><span className="gyms-eyebrow">{selected.label.toUpperCase()} MEMBERS</span><div className="gyms-price" aria-live="polite">{price == null ? 'LET’S TALK' : <>{money(price)}<small>/mo</small></>}</div><p>{price == null ? 'A tailored plan for your facility.' : annual ? '20% off with a one-year commitment.' : 'One monthly subscription for your gym.'}</p>{annual && price != null && <p className="gyms-fine">{money(price * 12)} over the 12-month commitment.</p>}<a href="#gym-contact" className="gyms-button">{price == null ? 'Discuss custom pricing' : 'Talk to us about this plan'}<ArrowUpRight size={18}/></a><p className="gyms-fine">We’ll confirm eligibility and onboarding before activation.</p></div></div></section>
      <section className="gyms-wrap gyms-faq"><h2>A FEW MORE DETAILS.</h2>{[['Is Pro included for every member?','Yes. The gym offering includes Pro access for members covered by your facility’s plan.'],['Does this include a personal coach for each member?','The plan includes coaching software for your trainers. Your facility decides how coaching services are offered to members.'],['What does unlimited mean for trainers?','Facility trainers receive the top coach edition without a cap on their client roster.'],['How does the one-year discount work?','A one-year commitment reduces the monthly price by 20%. We’ll confirm your agreement and billing details during onboarding.'],['We have more than 2,500 members. Can we join?','Yes. Contact us to discuss a custom plan for your facility.']].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
      <section id="gym-contact" className="gyms-wrap gyms-section gyms-contact"><div><p className="gyms-eyebrow">BRING MACROSTACK TO YOUR GYM</p><h2>LET’S BUILD<br /><span>YOUR MEMBER PERK.</span></h2><p>Tell us a little about your facility. We’ll discuss your plan, walk through the product, and coordinate the next steps.</p><a href="mailto:getmacrostack@gmail.com">getmacrostack@gmail.com <ArrowUpRight size={16}/></a></div><form onSubmit={prepareInquiry} onChange={()=>setDraft(null)}><label htmlFor="gym-name">Gym name</label><input id="gym-name" name="gym" required maxLength={150} autoComplete="organization"/><label htmlFor="gym-contact-name">Your name</label><input id="gym-contact-name" name="name" required maxLength={100} autoComplete="name"/><label htmlFor="gym-email">Work email</label><input id="gym-email" name="email" type="email" required maxLength={254} autoComplete="email"/><label htmlFor="gym-message">Anything we should know? <span>(optional)</span></label><textarea id="gym-message" name="message" rows={3} maxLength={1500}/><p className="gyms-fine">Selected: {selected.label} members · {annual ? 'One-year commitment' : 'Monthly'} · {price == null ? 'Custom pricing' : money(price) + '/month'}. <a href="#gym-pricing">Change plan</a></p><button className="gyms-button" type="submit">Prepare my inquiry <ArrowUpRight size={18}/></button><p className="gyms-fine">This prepares an email for you to review and send. No subscription is started.</p>{draft && <div className="gyms-draft" role="status"><strong>Your inquiry is ready.</strong><p>Open your email app, review the details, and send it to our team.</p><a className="gyms-button" href={draft}>Open email draft <ArrowUpRight size={18}/></a></div>}</form></section>
    </main><footer className="gyms-wrap gyms-footer"><a className="gyms-brand" href="/"><BrandWordmark /></a><span>TRACK. OPTIMIZE. PERFORM.</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Sign in</a></div></footer>
  </div>
}
function Benefit({ icon: Icon, title, text }) { return <div className="gyms-benefit"><Icon size={22}/><div><h4>{title}</h4><p>{text}</p></div></div> }
