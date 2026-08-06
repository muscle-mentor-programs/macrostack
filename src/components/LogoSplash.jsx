import { useEffect } from 'react'
import { isNativeApp } from '../lib/platform'

// Installed PWA / native shell — the intro is the app's boot screen there,
// so it renders big; in a browser it stays half-size ahead of the landing page.
const IS_STANDALONE =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  isNativeApp

/* ── LogoSplash — full-screen MacroStack logo animation (/intro.mp4) ──────────
   Two modes:
   - intro:   plays the full animation to the end (no skip), then calls
              onDone. A generous safety timer — longer than the video —
              rescues a stalled/blocked playback; it never cuts it short.
   - loading: loops silently for full-screen loading splashes.               */
export default function LogoSplash({ loop = false, onDone, fading = false }) {
  // Safety net only: the video runs ~1.8s at 1.5x — this fires well after its
  // natural end, so the animation always finishes unless playback is broken.
  useEffect(() => {
    if (loop || !onDone) return
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [loop, onDone])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: '#000',
        opacity: fading ? 0 : 1,
        transition: 'opacity 250ms ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* The video is trimmed to end the moment the logo completes (S meets
          the apple, ~2.7s source / ~1.8s at 1.5x). Intro renders at half
          size; the PWA/loading splash is full-screen scaled to 3.75x
          (logo sits small in the frame — the scale crops dead space). */}
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        loop={loop}
        onEnded={loop ? undefined : onDone}
        ref={(el) => { if (el) el.playbackRate = 1.5 }}
        className={loop || IS_STANDALONE
          ? 'w-full h-full object-contain scale-[2.36]'
          : 'w-1/2 h-1/2 object-contain'}
      />
    </div>
  )
}
