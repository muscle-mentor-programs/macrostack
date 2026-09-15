export function scrollToMarketingSection(id, { immediate = false } = {}) {
  const target = id ? document.getElementById(id) : null
  if (id && !target) return false
  const headerHeight = document.querySelector('.marketing-header')?.getBoundingClientRect().height || 72
  const top = target ? Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 20) : 0
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (window.lenis) {
    window.lenis.scrollTo(top, { duration: 1.2, immediate: immediate || reduced, easing: t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2 })
  } else {
    window.scrollTo({ top, behavior: immediate || reduced ? 'instant' : 'smooth' })
  }
  return true
}
