import { useEffect, useRef, useState } from 'react'
const sections = [['overview','Overview'],['journal','Journal'],['checkin','Check-ins'],['mealplans','Meal plans'],['photos','Photos'],['workspace','Notes & tasks']]
export default function ClientSections({ value, onChange }) {
  const row = useRef(null)
  const [scroll, setScroll] = useState({ width: 100, left: 0 })
  useEffect(() => {
    const el = row.current
    const measure = () => setScroll({ width: el.clientWidth / el.scrollWidth * 100, left: el.scrollLeft / el.scrollWidth * 100 })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    el.addEventListener('scroll', measure, { passive: true })
    measure()
    return () => { observer.disconnect(); el.removeEventListener('scroll', measure) }
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
    {scroll.width < 99.5 && <div className="coach-section-track" aria-hidden="true"><span style={{ width: `${scroll.width}%`, left: `${scroll.left}%` }} /></div>}
  </nav>
}
