import { useEffect, useState } from 'react'

// iOS keyboards resize the visual viewport, not necessarily the layout viewport.
export default function useFoodFormViewport() {
  const [style, setStyle] = useState({})
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    let frame
    const update = () => {
      setStyle({ top: viewport.offsetTop, height: viewport.height, bottom: 'auto' })
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const active = document.activeElement
        if (active?.matches('input, select') && active.closest('.food-form-panel')) {
          active.scrollIntoView({ block: 'nearest' })
        }
      })
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])
  return style
}
