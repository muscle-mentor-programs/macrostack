/* ── Retro CRT theme transition ───────────────────────────────────────────────
   Swaps the theme like an old TV changing channels: the current screen
   collapses into a white-hot horizontal scanline, then the new theme blooms
   out of the line with glitch jitter and brightness flicker. The animations
   live in index.css under html.crt-transition; browsers without the View
   Transitions API (and reduced-motion users) switch instantly. */

export function splatToggleTheme(_event, toggleTheme) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    toggleTheme()
    return
  }

  const html = document.documentElement
  html.classList.add('crt-transition')

  const transition = document.startViewTransition(() => toggleTheme())
  transition.finished.finally(() => html.classList.remove('crt-transition'))
}
