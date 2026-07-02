/* ── Retro-tech glitch theme transition ───────────────────────────────────────
   Swaps the theme like a digital signal cutting over: the old screen jitters
   with hue/contrast interference while the new theme sweeps across in jagged
   horizontal slice-bands that race each other, with a brightness flicker as
   it locks in. Animations live in index.css under html.theme-glitch; browsers
   without the View Transitions API (and reduced-motion users) switch
   instantly. */

export function splatToggleTheme(_event, toggleTheme) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    toggleTheme()
    return
  }

  const html = document.documentElement
  html.classList.add('theme-glitch')

  const transition = document.startViewTransition(() => toggleTheme())
  transition.finished.finally(() => html.classList.remove('theme-glitch'))
}
