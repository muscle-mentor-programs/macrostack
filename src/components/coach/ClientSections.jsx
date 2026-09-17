import { useEffect, useRef } from 'react'
const sections = [['overview','Overview'],['journal','Journal'],['checkin','Check-ins'],['mealplans','Meal plans'],['photos','Photos'],['workspace','Notes & tasks']]
export default function ClientSections({ value, onChange }) {
  const row = useRef(null)
  const track = useRef(null)
  const thumb = useRef(null)
  useEffect(() => {
    const el = row.current
    let frame = 0
    const measure = () => {
      frame = 0
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
      track.current.hidden = maxScroll < 2
      const trackWidth = track.current.clientWidth
      const width = trackWidth * el.clientWidth / el.scrollWidth
      const progress = maxScroll ? Math.min(1, Math.max(0, el.scrollLeft / maxScroll)) : 0
      thumb.current.style.width = `${width}px`
      thumb.current.style.transform = `translate3d(${progress * (trackWidth - width)}px,0,0)`
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    const observer = new ResizeObserver(schedule)
    observer.observe(el)
    for (const button of el.children) observer.observe(button)
    el.addEventListener('scroll', schedule, { passive: true })
    schedule()
    return () => { observer.disconnect(); el.removeEventListener('scroll', schedule); cancelAnimationFrame(frame) }
  }, [])
  useEffect(() => {
    const el = row.current
    const active = el.querySelector('[aria-current=page]')
    if (!active) return
    const offset = active.offsetLeft - el.offsetLeft - (el.clientWidth - active.offsetWidth) / 2
    el.scrollTo({ left: offset, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [value])
  return <nav className="coach-client-sections coach-client-scrollnav" aria-label="Client sections">
    <div className="coach-section-scroll" ref={row}>
      {sections.map(([id,label])=><button key={id} aria-current={value===id?'page':undefined} onClick={()=>onChange(id)}>{label}</button>)}
    </div>
    <div ref={track} className="coach-section-track" aria-hidden="true" hidden><span ref={thumb} /></div>
  </nav>
}
