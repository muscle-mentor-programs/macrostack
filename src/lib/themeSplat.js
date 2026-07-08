/* ── Premium theme cross-fade ─────────────────────────────────────────────────
   Light/dark switches via the View Transitions API: the browser snapshots the
   outgoing theme and cross-fades to the incoming one. The pacing/easing lives
   in index.css under `html.theme-fade::view-transition-*(root)`.

   Kept the original export name so callers (ThemeToggle, Landing) are
   untouched from the earlier paint-splatter implementation. */

export function splatToggleTheme(_event, toggleTheme) {
  // No View Transitions support (Firefox, older Safari) → instant switch.
  // Reduced-motion users also get the instant switch.
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    toggleTheme()
    return
  }

  const html = document.documentElement
  html.classList.add('theme-fade')

  const vt = document.startViewTransition(() => toggleTheme())
  vt.finished.finally(() => html.classList.remove('theme-fade'))
}
