import { useState, useEffect } from 'react'

/**
 * Returns true when the viewport is narrower than `breakpoint` px.
 * Uses matchMedia so it reacts to orientation changes and browser-resize.
 * Breakpoint default: 768 px  (same as Tailwind's `md`).
 */
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
      : false
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
