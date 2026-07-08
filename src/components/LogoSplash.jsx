import { useEffect, useRef, useState } from 'react'

/* ── LogoSplash — full-screen MacroStack logo animation (/intro.mp4) ──────────
   Two modes:
   - intro:   plays once, then fades out and calls onDone (landing entrance).
              Tap/click anywhere skips. A safety timer fires onDone even if
              the video stalls or autoplay is blocked.
   - loading: loops silently for full-screen loading splashes.               */
export default function LogoSplash({ loop = false, onDone, fading = false }) {
  const videoRef = useRef(null)
  const [showSkip, setShowSkip] = useState(false)

  // Surface the skip hint after a beat (intro mode only)
  useEffect(() => {
    if (loop) return
    const t = setTimeout(() => setShowSkip(true), 1800)
    return () => clearTimeout(t)
  }, [loop])

  // Safety net: if 'ended' never fires (stalled network, blocked autoplay),
  // move on anyway shortly after the video's natural 7s runtime.
  useEffect(() => {
    if (loop || !onDone) return
    const t = setTimeout(onDone, 8500)
    return () => clearTimeout(t)
  }, [loop, onDone])

  return (
    <div
      onClick={loop ? undefined : onDone}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: '#000',
        cursor: loop ? 'default' : 'pointer',
        opacity: fading ? 0 : 1,
        transition: 'opacity 700ms ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        loop={loop}
        onEnded={loop ? undefined : onDone}
        className="w-full h-full object-contain"
      />
      {!loop && (
        <p
          className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-white/40 transition-opacity duration-500"
          style={{ opacity: showSkip ? 1 : 0 }}
        >
          TAP TO SKIP
        </p>
      )}
    </div>
  )
}
