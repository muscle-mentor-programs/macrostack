import { useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Camera, Trash2, X, Loader2, ImagePlus, Columns2 } from 'lucide-react'
import useStore from '../store'
import { successHaptic } from '../utils/haptics'

/* Progress-photo timeline — shared by the client WEIGHT page (canEdit) and
   the coach's client detail (read-only). Photos render oldest → newest so
   the strip reads like a transformation timeline. */
export default function ProgressPhotos({ client, canEdit = false }) {
  const { addProgressPhoto, deleteProgressPhoto } = useStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [viewer, setViewer]       = useState(null)   // photo being viewed full-screen
  const [comparing, setComparing] = useState(false)  // compare-select mode
  const [comparePicks, setComparePicks] = useState([]) // up to 2 photos
  const fileRef = useRef(null)

  const photos = client?.photos || []

  const pickForCompare = (photo) => {
    setComparePicks((prev) => {
      if (prev.some((p) => p.id === photo.id)) return prev.filter((p) => p.id !== photo.id)
      const next = [...prev, photo]
      return next.slice(-2)
    })
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setUploading(true); setError('')
    const res = await addProgressPhoto(client.id, file)
    if (res?.error) setError('Upload failed. Please try again.')
    else successHaptic()
    setUploading(false)
  }

  const handleDelete = (photo) => {
    deleteProgressPhoto(client.id, photo)
    if (viewer?.id === photo.id) setViewer(null)
  }

  const dateLabel = (p) => {
    const d = p.takenAt || p.createdAt
    try { return format(parseISO(d), 'MMM d, yyyy') } catch { return '' }
  }

  if (!canEdit && photos.length === 0) {
    return (
      <div className="glass-card border border-border rounded-2xl p-8 text-center card-dim">
        <Camera size={22} className="text-dim mx-auto mb-2" />
        <p className="font-display font-bold text-sm text-muted tracking-widest">NO PROGRESS PHOTOS</p>
        <p className="font-mono text-xs text-dim mt-1.5">
          {client?.name?.split(' ')[0] || 'This user'} hasn't uploaded any progress photos yet.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Compare toggle — the before/after money shot */}
      {photos.length >= 2 && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { setComparing((v) => !v); setComparePicks([]) }}
            className="flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors"
            style={comparing
              ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' }
              : { borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            <Columns2 size={11} />
            {comparing ? 'CANCEL COMPARE' : 'COMPARE'}
          </button>
          {comparing && (
            <span className="font-mono text-[10px] text-muted">
              Pick two photos ({comparePicks.length}/2)
            </span>
          )}
        </div>
      )}

      {/* Timeline strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {/* Add tile (client only) */}
        {canEdit && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 w-24 aspect-[3/4] rounded-xl border border-dashed border-border hover:border-brown/60 flex flex-col items-center justify-center gap-2 text-dim hover:text-brown-light transition-colors disabled:opacity-50"
          >
            {uploading
              ? <Loader2 size={18} className="animate-spin" />
              : <ImagePlus size={18} />}
            <span className="font-mono text-[9px] tracking-widest">
              {uploading ? 'UPLOADING' : 'ADD PHOTO'}
            </span>
          </button>
        )}

        {photos.map((p) => {
          const picked = comparePicks.some((x) => x.id === p.id)
          return (
            <button
              key={p.id}
              onClick={() => (comparing ? pickForCompare(p) : setViewer(p))}
              className="relative flex-shrink-0 w-24 group"
            >
              <img
                src={p.url}
                alt={`Progress ${dateLabel(p)}`}
                loading="lazy"
                className="w-24 aspect-[3/4] object-cover rounded-xl border transition-all"
                style={picked
                  ? { borderColor: 'var(--color-accent)', boxShadow: '0 0 0 2px var(--color-accent)' }
                  : { borderColor: 'var(--color-border)' }}
              />
              {picked && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold text-white"
                  style={{ background: 'var(--color-accent)' }}>
                  {comparePicks.findIndex((x) => x.id === p.id) + 1}
                </span>
              )}
              <p className="font-mono text-[9px] text-muted text-center mt-1.5 truncate">
                {dateLabel(p)}
              </p>
            </button>
          )
        })}
      </div>

      {canEdit && photos.length === 0 && !uploading && (
        <p className="font-mono text-xs text-dim mt-2">
          Add a photo every week or two — you and your coach will see the timeline here.
        </p>
      )}
      {error && <p className="font-mono text-xs text-red-400 mt-2">{error}</p>}

      {/* Hidden file input */}
      {canEdit && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      )}

      {/* Side-by-side comparison */}
      {comparePicks.length === 2 && (
        <div
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col items-center justify-center p-5 anim-fade-in"
          onClick={() => setComparePicks([])}
        >
          <button
            onClick={() => setComparePicks([])}
            className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted hover:text-cream transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex gap-3 max-w-full" onClick={(e) => e.stopPropagation()}>
            {[...comparePicks].sort((a, b) => (a.takenAt || '').localeCompare(b.takenAt || '')).map((p, i) => (
              <div key={p.id} className="flex-1 min-w-0 text-center">
                <img src={p.url} alt={dateLabel(p)}
                  className="max-h-[70vh] w-auto max-w-full rounded-2xl border border-border object-contain mx-auto" />
                <p className="font-mono text-xs mt-3" style={{ color: i === 0 ? 'var(--color-muted)' : 'var(--color-accent)' }}>
                  {i === 0 ? 'BEFORE · ' : 'AFTER · '}{dateLabel(p)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen viewer */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col items-center justify-center p-5 anim-fade-in"
          onClick={() => setViewer(null)}
        >
          <button
            onClick={() => setViewer(null)}
            className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted hover:text-cream transition-colors"
          >
            <X size={16} />
          </button>
          <img
            src={viewer.url}
            alt={`Progress ${dateLabel(viewer)}`}
            className="max-w-full max-h-[75vh] rounded-2xl border border-border object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="font-mono text-xs text-muted mt-4">{dateLabel(viewer)}</p>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(viewer) }}
              className="flex items-center gap-1.5 mt-3 font-mono text-xs text-dim hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-red-400/40"
            >
              <Trash2 size={12} />
              DELETE PHOTO
            </button>
          )}
        </div>
      )}
    </div>
  )
}
