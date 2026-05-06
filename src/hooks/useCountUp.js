import { useState, useEffect, useRef } from 'react'

/**
 * Animates a number from 0 to `target` using an ease-out cubic curve.
 * @param {number} target  - Final value
 * @param {number} duration - ms (default 900)
 * @param {number} delay    - ms before starting (default 0)
 */
export function useCountUp(target, duration = 900, delay = 0) {
  const [value, setValue] = useState(0)
  const rafRef = useRef()

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    let startTime = null

    const tick = (now) => {
      if (!startTime) startTime = now

      const elapsed = now - startTime
      if (elapsed < delay) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const adjusted = elapsed - delay
      const progress = Math.min(adjusted / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      setValue(target * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setValue(target)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, delay])

  return value
}
