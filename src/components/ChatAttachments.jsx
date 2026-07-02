import { useRef, useState } from 'react'
import { ImagePlus, Mic, Square, Loader2 } from 'lucide-react'
import useStore from '../store'

/* ── Chat attachments — image picker + voice notes ────────────────────────────
   AttachmentButtons sits in a chat composer; onSend(attachment) fires with
   { url, type } after upload. MessageAttachment renders one in a bubble. */

export function AttachmentButtons({ clientId, onSend, disabled }) {
  const uploadChatAttachment = useStore((s) => s.uploadChatAttachment)
  const [busy, setBusy]           = useState(false)
  const [recording, setRecording] = useState(false)
  const fileRef     = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef   = useRef([])

  const sendFile = async (file, type) => {
    setBusy(true)
    const res = await uploadChatAttachment(clientId, file, type)
    setBusy(false)
    if (res?.url) onSend(res)
  }

  const pickImage = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) sendFile(f, 'image')
  }

  const toggleRecord = async () => {
    if (recording) {
      recorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: mime })
        if (blob.size > 1000) {
          const file = new File([blob], `voice.${mime.includes('webm') ? 'webm' : 'm4a'}`, { type: mime })
          sendFile(file, 'audio')
        }
      }
      recorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch {
      /* mic permission denied — nothing to do */
    }
  }

  const btnCls = 'w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl border transition-colors disabled:opacity-40'

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || busy || recording}
        title="Send a photo"
        className={`${btnCls} border-border text-muted hover:text-cream hover:border-muted`}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
      </button>
      <button
        type="button"
        onClick={toggleRecord}
        disabled={disabled || busy}
        title={recording ? 'Stop and send' : 'Record a voice note'}
        className={btnCls}
        style={recording
          ? { borderColor: '#f87171', color: '#f87171', background: 'rgba(248,113,113,0.1)' }
          : { borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
      >
        {recording ? <Square size={13} className="animate-pulse" /> : <Mic size={15} />}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
    </>
  )
}

export function MessageAttachment({ url, type }) {
  const [viewer, setViewer] = useState(false)
  if (!url) return null
  if (type === 'audio') {
    return <audio controls src={url} className="max-w-[240px] h-10 mt-1" preload="metadata" />
  }
  return (
    <>
      <button onClick={() => setViewer(true)} className="block mt-1">
        <img src={url} alt="Attachment" loading="lazy"
          className="max-w-[220px] max-h-[260px] rounded-xl border border-border object-cover" />
      </button>
      {viewer && (
        <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-5 anim-fade-in"
          onClick={() => setViewer(false)}>
          <img src={url} alt="Attachment" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
        </div>
      )}
    </>
  )
}
