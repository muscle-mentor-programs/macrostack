/* ── Splatter theme transition ────────────────────────────────────────────────
   Swaps the theme inside a View Transition and reveals the new one through an
   organic ink-splat clip-path that grows from the click point. Browsers
   without the View Transitions API just switch instantly. */

const POINTS = 18

export function splatToggleTheme(event, toggleTheme) {
  // No API (e.g. Firefox) or reduced motion → instant switch
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    toggleTheme()
    return
  }

  const x = event?.clientX ?? window.innerWidth - 48
  const y = event?.clientY ?? 48

  // Farthest corner (with headroom so the splat's shortest lobe still covers)
  const maxR = 1.35 * Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  // A wobbly polygon — same vertex count at both keyframes interpolates
  // smoothly, and the per-point jitter is what reads as "splatter".
  const jitter = Array.from({ length: POINTS }, () => 0.72 + Math.random() * 0.56)
  const splat = (r) =>
    'polygon(' +
    jitter
      .map((j, i) => {
        const a = (i / POINTS) * Math.PI * 2
        return `${(x + Math.cos(a) * r * j).toFixed(1)}px ${(y + Math.sin(a) * r * j).toFixed(1)}px`
      })
      .join(',') +
    ')'

  const transition = document.startViewTransition(() => toggleTheme())

  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [splat(3), splat(maxR)] },
      {
        duration: 700,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  }).catch(() => { /* transition skipped — theme already applied */ })
}
