import { useEffect } from 'react'

/* ── LogoSplash — full-screen MacroStack logo animation (/intro.mp4) ──────────
   Two modes:
   - intro:   plays the full animation to the end (no skip), then calls
              onDone. A generous safety timer — longer than the video —
              rescues a stalled/blocked playback; it never cuts it short.
   - loading: loops silently for full-screen loading splashes.               */
export default function LogoSplash({ loop = false, onDone, fading = false }) {
  // Safety net only: the video runs 7s — this fires well after its natural
  // end, so the animation always finishes unless playback itself is broken.
  useEffect(() => {
    if (loop || !onDone) return
    const t = setTimeout(onDone, 10000)
    return () => clearTimeout(t)
  }, [loop, onDone])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: '#000',
        opacity: fading ? 0 : 1,
        transition: 'opacity 700ms ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        loop={loop}
        onEnded={loop ? undefined : onDone}
        className="w-full h-full object-contain"
      />
    </div>
  )
}
