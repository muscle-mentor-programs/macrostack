import { useEffect, useRef } from 'react'
const sections = [['overview','Overview'],['journal','Journal'],['checkin','Check-ins'],['mealplans','Meal plans'],['photos','Photos'],['workspace','Notes & tasks']]
export default function ClientSections({ value, onChange }) {
  const more = useRef(null)
  useEffect(() => {
    const dismiss = event => {
      if (!more.current?.open) return
      if (event.type === 'keydown' && event.key === 'Escape') { more.current.open = false; more.current.querySelector('summary')?.focus() }
      if (event.type === 'pointerdown' && !more.current.contains(event.target)) more.current.open = false
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', dismiss)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss) }
  }, [])
  const current = sections.find(([id]) => id === value)?.[1]
  return <nav className="coach-client-sections" aria-label="Client sections">
    {sections.map(([id,label],i)=><button key={id} className={i>2?'coach-secondary-section':''} aria-current={value===id?'page':undefined} onClick={()=>onChange(id)}>{label}</button>)}
    <details ref={more} className="coach-section-more"><summary>{sections.slice(3).some(([id])=>id===value)?current:'More'}</summary><div>{sections.slice(3).map(([id,label])=><button key={id} aria-current={value===id?'page':undefined} onClick={()=>{onChange(id);more.current.open=false}}>{label}</button>)}</div></details>
  </nav>
}
