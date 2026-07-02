/* ── Layered sweep theme transition ───────────────────────────────────────────
   The new theme slides over the old one in layered horizontal bands that
   lead and lag each other. Directional: switching to LIGHT sweeps to the
   right, switching to DARK sweeps to the left. Animations live in index.css
   under html.theme-glitch-ltr / -rtl; browsers without the View Transitions
   API (and reduced-motion users) switch instantly. */

export function splatToggleTheme(_event, toggleTheme) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    toggleTheme()
    return
  }

  const html = document.documentElement
  // Currently dark → heading to light → sweep right; otherwise sweep left.
  const dirClass = html.classList.contains('ocean-dark') ? 'theme-glitch-ltr' : 'theme-glitch-rtl'
  html.classList.add(dirClass)

  const transition = document.startViewTransition(() => toggleTheme())
  transition.finished.finally(() => html.classList.remove(dirClass))
}
