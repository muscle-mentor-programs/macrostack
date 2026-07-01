import { useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Camera, Trash2, X, Loader2, ImagePlus } from 'lucide-react'
import useStore from '../store'
import { successHaptic } from '../utils/haptics'

/* Progress-photo timeline — shared by the client WEIGHT page (canEdit) and
   the coach's client detail (read-only). Photos render oldest → newest so
   the strip reads like a transformation timeline. */
export default function ProgressPhotos({ client, canEdit = false }) {
  const { addProgressPhoto, deleteProgressPhoto } = useStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [viewer, setViewer]       = useState(null) // photo being viewed full-screen
  const fileRef = useRef(null)

  const photos = client?.photos || []

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

        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewer(p)}
            className="relative flex-shrink-0 w-24 group"
          >
            <img
              src={p.url}
              alt={`Progress ${dateLabel(p)}`}
              loading="lazy"
              className="w-24 aspect-[3/4] object-cover rounded-xl border border-border group-hover:border-brown/50 transition-colors"
            />
            <p className="font-mono text-[9px] text-muted text-center mt-1.5 truncate">
              {dateLabel(p)}
            </p>
          </button>
        ))}
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
