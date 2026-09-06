import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── App-wide motion engine ─────────────────────────────────────────────────
   Every page already marks its entrance blocks with anim-* utility classes —
   that IS the choreography intent map. This engine takes those elements over
   (disables their CSS animation inline) and re-drives them with GSAP:

   • blocks visible in the scroller get a staggered spring entrance
   • blocks below the fold reveal as they scroll into view (ScrollTrigger
     bound to the app's overflow scroller, marked with [data-scroller])
   • nested anim-* elements (rows inside cards) keep their CSS cascade —
     only top-level blocks are re-choreographed

   Zero per-page changes needed. Pages mount inside <MotionPage> via App.jsx.
──────────────────────────────────────────────────────────────────────────── */

const TARGETS =
  '[class*="anim-fade"], [class*="anim-pop"], [class*="anim-scale-in"], [class*="anim-slide"]'

/* Above this many below-fold blocks, the tail is shown statically — avoids
   creating hundreds of ScrollTriggers on long list pages. */
const MAX_REVEALS = 24

// A suspended mobile animation ticker must never leave a loaded page invisible.
// Keep a subtle fade, but make every frame readable, including the initial one.
const ENTRANCE_ALPHA = 0.85

export default function MotionPage({ children }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const scroller = root.closest('[data-scroller]')

    const ctx = gsap.context(() => {
      const all = [...root.querySelectorAll(TARGETS)]
      // Top-level intent blocks only — nested anim elements ride along with
      // their parent (and keep their own CSS row cascades).
      const tops = all.filter((el) => !all.some((o) => o !== el && o.contains(el)))
      if (!tops.length) return

      // Take over from CSS so nothing double-animates
      gsap.set(tops, { animation: 'none' })

      const viewBottom = scroller
        ? scroller.getBoundingClientRect().bottom
        : window.innerHeight

      const above = []
      const below = []
      tops.forEach((el) => {
        ;(el.getBoundingClientRect().top < viewBottom ? above : below).push(el)
      })

      // Entrance choreography — spring rise, header first, cards cascade
      if (above.length) {
        gsap.fromTo(above,
          { y: 26, autoAlpha: ENTRANCE_ALPHA, scale: 0.985 },
          {
            y: 0, autoAlpha: 1, scale: 1,
            duration: 0.55, ease: 'power3.out', stagger: 0.06,
            clearProps: 'transform',
          })
      }

      // Scroll reveals — only when we have a known scroller to bind to
      if (scroller) {
        below.slice(0, MAX_REVEALS).forEach((el) => {
          gsap.fromTo(el,
            { y: 30, autoAlpha: ENTRANCE_ALPHA },
            {
              y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out',
              clearProps: 'transform',
              scrollTrigger: { trigger: el, scroller, start: 'top 94%', once: true },
            })
        })
        // Anything past the cap shows statically — never leave content hidden
        if (below.length > MAX_REVEALS) {
          gsap.set(below.slice(MAX_REVEALS), { autoAlpha: 1 })
        }
      } else if (below.length) {
        // No scroller (desktop coach pages self-scroll) — include in entrance
        gsap.fromTo(below,
          { y: 26, autoAlpha: ENTRANCE_ALPHA },
          { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', stagger: 0.04, clearProps: 'transform' })
      }
    }, root)

    return () => ctx.revert()
  }, [])

  /* display:contents — no layout box, so pages' min-h-full chains and flex
     layouts behave exactly as if MotionPage weren't there */
  return <div ref={ref} className="contents">{children}</div>
}
