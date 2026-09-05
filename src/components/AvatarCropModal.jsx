/**
 * AvatarCropModal
 * Full-screen crop UI for profile pictures.
 * Uses react-easy-crop with a circular crop area.
 * Calls onConfirm(blob) with the cropped image, or onCancel() to dismiss.
 */
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X } from 'lucide-react'

/** Turn the pixel crop from react-easy-crop into a Blob via canvas. */
async function cropToBlob(imageSrc, pixelCrop, mimeType = 'image/jpeg') {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.addEventListener('load', () => resolve(i))
    i.addEventListener('error', reject)
    i.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width  = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Photo editing is unavailable in this browser.')

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    512, 512,
  )

  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not prepare this photo. Please choose another image.')), mimeType, 0.88))
}

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const [crop,       setCrop]       = useState({ x: 0, y: 0 })
  const [zoom,       setZoom]       = useState(1)
  const [croppedArea, setCroppedArea] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedArea || confirming) return
    setConfirming(true)
    setError('')
    try {
      const blob = await cropToBlob(imageSrc, croppedArea)
      await onConfirm(blob)
    } catch (err) {
      setError(err.message || 'Could not save your photo. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Crop profile photo" aria-busy={confirming} className="fixed inset-0 z-[200] flex flex-col bg-bg anim-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-mobile-header pb-4 border-b border-border glass-panel flex-shrink-0">
        <button
          onClick={onCancel}
          disabled={confirming}
          aria-label="Cancel photo upload"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-cream transition-colors"
        >
          <X size={20} />
        </button>
        <p className="font-display font-bold text-sm tracking-widest text-cream">CROP PHOTO</p>
        <button
          onClick={handleConfirm}
          disabled={confirming || !croppedArea}
          className="flex items-center gap-1.5 bg-brown hover:bg-brown-light disabled:opacity-50 text-bg font-display font-bold text-sm tracking-widest px-4 py-2 rounded-xl transition-colors glow-hover"
        >
          {confirming
            ? <><div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin" /> SAVING</>
            : <><Check size={14} /> SAVE</>
          }
        </button>
      </div>

      {/* Cropper canvas — fills remaining space */}
      <div className="relative flex-1 bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          mediaProps={{ onError: () => setError('This image could not be opened. Choose a JPG, PNG, or WebP photo.') }}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle:  {
              border: '2px solid var(--color-accent)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
            },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div className="flex-shrink-0 px-8 py-5 border-t border-border glass-panel">
        {error && <p role="alert" className="text-sm text-red-400 text-center mb-3">{error}</p>}
        <p className="font-mono text-xs text-muted text-center mb-3 tracking-widest">PINCH OR DRAG TO ADJUST</p>
        <input
          type="range"
          aria-label="Photo zoom"
          disabled={confirming}
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--color-accent)' }}
        />
      </div>

    </div>
  )
}
