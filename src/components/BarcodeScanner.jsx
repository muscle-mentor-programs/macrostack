import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  MultiFormatReader,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  DecodeHintType,
  BarcodeFormat,
} from '@zxing/library'

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const vfRef     = useRef(null)
  const rafRef    = useRef(null)
  const streamRef = useRef(null)
  const readerRef = useRef(null)
  const doneRef   = useRef(false)   // prevents double-fire after a successful decode

  const [flash, setFlash] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // ── ZXing reader with product barcode formats ──────────────────
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)
    const mfr = new MultiFormatReader()
    mfr.setHints(hints)
    readerRef.current = mfr

    function stopCamera() {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }

    // ── rAF decode loop ────────────────────────────────────────────
    function tick() {
      const video  = videoRef.current
      const canvas = canvasRef.current
      const vfEl   = vfRef.current

      if (!video || !canvas || !vfEl || doneRef.current) return

      // Wait until video has actual pixel data
      if (video.readyState < 2 || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const natW  = video.videoWidth
      const natH  = video.videoHeight
      const dispW = video.clientWidth
      const dispH = video.clientHeight

      // object-fit: cover scale factor
      const s     = Math.max(dispW / natW, dispH / natH)
      // How much the rendered video overhangs on each side
      const xOver = (natW * s - dispW) / 2
      const yOver = (natH * s - dispH) / 2

      // Viewfinder position relative to the video element's top-left corner
      const videoRect = video.getBoundingClientRect()
      const vfRect    = vfEl.getBoundingClientRect()
      const relX      = vfRect.left - videoRect.left
      const relY      = vfRect.top  - videoRect.top

      // Map display coords → natural video pixel coords
      const roiX = Math.max(0, (relX + xOver) / s)
      const roiY = Math.max(0, (relY + yOver) / s)
      const roiW = Math.min(vfRect.width  / s, natW - roiX)
      const roiH = Math.min(vfRect.height / s, natH - roiY)

      if (roiW < 1 || roiH < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      canvas.width  = Math.round(roiW)
      canvas.height = Math.round(roiH)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(video, roiX, roiY, roiW, roiH, 0, 0, canvas.width, canvas.height)

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const raw     = imgData.data
        // Pack RGBA Uint8 bytes → ARGB Int32 that ZXing RGBLuminanceSource expects
        const pixels  = new Int32Array(canvas.width * canvas.height)
        for (let i = 0; i < pixels.length; i++) {
          pixels[i] =
            ((raw[i * 4 + 3] & 0xff) << 24) |  // A
            ((raw[i * 4 + 0] & 0xff) << 16) |  // R
            ((raw[i * 4 + 1] & 0xff) << 8)  |  // G
             (raw[i * 4 + 2] & 0xff)            // B
        }
        const luminance = new RGBLuminanceSource(pixels, canvas.width, canvas.height)
        const bitmap    = new BinaryBitmap(new HybridBinarizer(luminance))
        const result    = readerRef.current.decode(bitmap)

        // result is only returned when a barcode is found; otherwise decode() throws
        if (!doneRef.current) {
          doneRef.current = true
          setFlash(true)
          // Brief green flash, then fire callback and stop camera
          setTimeout(() => {
            stopCamera()
            onScan(result.getText())
          }, 380)
          return
        }
      } catch (_) {
        // NotFoundException is normal (no barcode in frame) — keep looping
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    // ── Start camera ───────────────────────────────────────────────
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        return videoRef.current.play()
      })
      .then(() => {
        setReady(true)
        rafRef.current = requestAnimationFrame(tick)
      })
      .catch((err) => {
        if (err?.name === 'NotAllowedError') {
          setError('Camera access was denied. Grant camera permission in your browser settings and try again.')
        } else {
          setError('Could not start the camera. Please try again.')
        }
      })

    return stopCamera
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[60] bg-black overflow-hidden">
      {/* Scan-line keyframes */}
      <style>{`
        @keyframes _bcs_line {
          0%   { top: 6px; }
          50%  { top: 188px; }
          100% { top: 6px; }
        }
        ._bcs_line { animation: _bcs_line 2.4s ease-in-out infinite; }
      `}</style>

      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Off-screen canvas for decoding — never shown */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Green success flash */}
      {flash && (
        <div className="absolute inset-0 z-30 bg-green-400/30 pointer-events-none" />
      )}

      {/*
        Viewfinder hole with dark surround.
        box-shadow trick: a massive spread shadow darkens everything OUTSIDE this element.
        The element itself (the viewfinder rect) has no background, so the video shows through.
        vfRef lives here so ROI math can use getBoundingClientRect().
      */}
      <div
        ref={vfRef}
        className="absolute z-10 pointer-events-none"
        style={{
          left: '9vw',
          top: 'calc(50% - 100px)',
          width: '82vw',
          height: '200px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
        }}
      >
        {/* Corner bracket — top-left */}
        <div className="absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] border-brown rounded-tl" />
        {/* Corner bracket — top-right */}
        <div className="absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] border-brown rounded-tr" />
        {/* Corner bracket — bottom-left */}
        <div className="absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] border-brown rounded-bl" />
        {/* Corner bracket — bottom-right */}
        <div className="absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] border-brown rounded-br" />

        {/* Animated horizontal scan line */}
        <div
          className="_bcs_line absolute left-3 right-3 h-px"
          style={{ background: 'rgba(188,143,100,0.85)', top: 6 }}
        />
      </div>

      {/* Top bar: title + close button */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-6">
        <div>
          <p className="font-display font-black text-lg tracking-widest text-white drop-shadow-lg">
            SCAN BARCODE
          </p>
          <p className="font-mono text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {ready ? 'Align barcode inside the brackets' : 'Starting camera…'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Bottom hint */}
      {!error && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 flex justify-center">
          <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Supports UPC-A · UPC-E · EAN-13 · EAN-8 · CODE-128
          </p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 z-40 bg-card border border-border rounded-2xl p-6 text-center shadow-2xl">
          <p className="font-mono text-sm text-red-400 mb-5 leading-relaxed">{error}</p>
          <button
            onClick={onClose}
            className="bg-brown text-bg font-display font-bold text-sm tracking-widest px-7 py-3 rounded-lg"
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  )
}
