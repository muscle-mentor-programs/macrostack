/* ── Realistic paint-splatter theme transition ────────────────────────────────
   The new theme is revealed through a mask built from many circles:
   • 7 overlapping lobes form the organic splat body (round edges, no spikes)
   • 14 satellite droplets spray outward and land ahead of the body
   The splat bursts from the CENTER of the screen; every layer's size and
   position is randomized per toggle, then the body balloons past the corners
   and swallows everything. Browsers without the View Transitions API (and
   reduced-motion users) switch instantly. */

const rnd = (a, b) => a + Math.random() * (b - a)

export function splatToggleTheme(_event, toggleTheme) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    toggleTheme()
    return
  }

  // Always burst from the middle of the screen
  const x = window.innerWidth / 2
  const y = window.innerHeight / 2
  const maxR = 1.25 * Math.hypot(x, y)

  const layers = []

  // Splat body — overlapping lobes clustered on the center
  for (let i = 0; i < 7; i++) {
    const a = rnd(0, Math.PI * 2)
    const off = rnd(0, maxR * 0.1)
    const mid = maxR * rnd(0.09, 0.2)
    layers.push({
      cx: x + Math.cos(a) * off,
      cy: y + Math.sin(a) * off,
      r: [0, mid, maxR * rnd(0.42, 0.58), maxR * rnd(1.1, 1.35)],
    })
  }

  // Droplets — fly outward from the center and land as spatter dots
  for (let j = 0; j < 14; j++) {
    const a = rnd(0, Math.PI * 2)
    const dist = maxR * rnd(0.16, 0.5)
    const r = rnd(5, 26) * (Math.random() < 0.2 ? 2.1 : 1) // a few fat splats
    layers.push({
      cx: x + Math.cos(a) * dist,
      cy: y + Math.sin(a) * dist,
      startCx: x + Math.cos(a) * dist * 0.35,
      startCy: y + Math.sin(a) * dist * 0.35,
      r: [0, r, r, r],
    })
  }

  // One radial-gradient circle per layer; animate each layer's size/position
  // (both interpolate as comma lists) so droplets travel while they grow.
  const pos = (l, k) => {
    const cx = k === 0 && l.startCx !== undefined ? l.startCx : l.cx
    const cy = k === 0 && l.startCy !== undefined ? l.startCy : l.cy
    const s = l.r[k]
    return `${(cx - s).toFixed(1)}px ${(cy - s).toFixed(1)}px`
  }
  const size = (l, k) => `${(l.r[k] * 2).toFixed(1)}px ${(l.r[k] * 2).toFixed(1)}px`
  const frame = (k) => ({
    maskPosition:       layers.map((l) => pos(l, k)).join(', '),
    maskSize:           layers.map((l) => size(l, k)).join(', '),
    webkitMaskPosition: layers.map((l) => pos(l, k)).join(', '),
    webkitMaskSize:     layers.map((l) => size(l, k)).join(', '),
  })

  const maskImage = layers
    .map(() => 'radial-gradient(closest-side, #000 97%, transparent 100%)')
    .join(', ')
  const statics = {
    maskImage,        maskRepeat: 'no-repeat',
    webkitMaskImage: maskImage, webkitMaskRepeat: 'no-repeat',
  }

  const html = document.documentElement
  // Keeps the new snapshot hidden (CSS opacity:0) until our animation owns it,
  // so it can't flash unmasked on the first frame.
  html.classList.add('theme-splat')

  const transition = document.startViewTransition(() => toggleTheme())
  transition.finished.finally(() => html.classList.remove('theme-splat'))

  transition.ready.then(() => {
    html.animate(
      [
        { ...statics, ...frame(0), opacity: 1, offset: 0 },      // impact
        { ...statics, ...frame(1), opacity: 1, offset: 0.26 },   // droplets land, body lobes visible
        { ...statics, ...frame(2), opacity: 1, offset: 0.58 },   // body swells smoothly
        { ...statics, ...frame(3), opacity: 1, offset: 1 },      // body floods the screen
      ],
      {
        duration: 1600,
        easing: 'cubic-bezier(0.38, 0.1, 0.22, 1)',
        // Hold the final (fully-covered) frame until the transition tears
        // down, so there's no end-of-animation flash back to hidden.
        fill: 'forwards',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  }).catch(() => { /* transition skipped — theme already applied */ })
}
