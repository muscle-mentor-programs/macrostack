/* ── Paint-splash theme transition ────────────────────────────────────────────
   Swaps the theme inside a View Transition and reveals the new one through an
   animated splat clip-path growing from the click point: long tendrils shoot
   out first, the body of the splash catches up, and the edge stays liquid the
   whole way (per-point radii differ at every keyframe). Browsers without the
   View Transitions API just switch instantly. */

const POINTS = 28

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

  // Farthest corner, with headroom so even the shallowest notch covers it
  const maxR = 1.6 * Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  // One splat = per-point radius multipliers. Every ~3rd point is a tendril
  // (long spike); the rest form the irregular body between them.
  const angles = Array.from({ length: POINTS }, (_, i) => {
    const base = (i / POINTS) * Math.PI * 2
    return base + (Math.random() - 0.5) * (Math.PI / POINTS) // angular wobble
  })
  const isTendril = angles.map((_, i) => i % 3 === 0 || Math.random() < 0.14)
  const jitterAt = (spread) =>
    angles.map((_, i) =>
      isTendril[i]
        ? 1.15 + Math.random() * spread          // tendrils reach far
        : 0.45 + Math.random() * 0.4              // body lags behind
    )
  const jStart = jitterAt(0.9)   // burst: tendrils shoot ahead hard
  const jMid   = jitterAt(0.55)  // edge re-wobbles as the body catches up
  const jEnd   = angles.map(() => 1.05 + Math.random() * 0.25) // full coverage

  const splat = (r, jit) =>
    'polygon(' +
    angles
      .map((a, i) =>
        `${(x + Math.cos(a) * r * jit[i]).toFixed(1)}px ${(y + Math.sin(a) * r * jit[i]).toFixed(1)}px`
      )
      .join(',') +
    ')'

  const transition = document.startViewTransition(() => toggleTheme())

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          splat(4, jStart),            // pinprick
          splat(maxR * 0.42, jStart),  // tendrils lash out
          splat(maxR * 0.78, jMid),    // body surges, edge stays liquid
          splat(maxR, jEnd),           // splash settles over everything
        ],
        offset: [0, 0.38, 0.72, 1],
      },
      {
        duration: 1250,
        easing: 'cubic-bezier(0.16, 0.85, 0.25, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  }).catch(() => { /* transition skipped — theme already applied */ })
}
