import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera } from 'lucide-react'
import AvatarCropModal from './AvatarCropModal'
import { supabase } from '../lib/supabase'

export default function MarketplacePhotoUpload({ userId, value, onChange, cover = false, disabled }) {
  const input = useRef(null)
  const [source, setSource] = useState(null)
  const [message, setMessage] = useState('')
  const label = cover ? 'Cover photo' : 'Profile photo'
  useEffect(() => () => { if (source) URL.revokeObjectURL(source) }, [source])
  function select(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setMessage('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setMessage('Choose a JPG, PNG, or WebP photo.'); return }
    if (file.size > 20 * 1024 * 1024) { setMessage('Choose a photo smaller than 20 MB.'); return }
    setSource(URL.createObjectURL(file))
  }
  async function upload(blob) {
    if (!supabase || !userId) throw new Error('Please sign in again before uploading.')
    const path = `${userId}/${cover ? 'cover' : 'avatar'}-${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from('marketplace-images').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (error) throw new Error('Photo upload failed. Your existing photo is unchanged. Please try again.')
    const { data } = supabase.storage.from('marketplace-images').getPublicUrl(path)
    onChange(data.publicUrl)
    setSource(null)
    setMessage('Photo uploaded. Save your marketplace profile to apply it.')
  }
  return <div className="space-y-3">
    <p className="text-sm">{label}</p>
    <button type="button" disabled={disabled} onClick={() => input.current?.click()} aria-label={`Upload ${label.toLowerCase()}`} className={`relative overflow-hidden border border-border bg-surface flex items-center justify-center ${cover ? 'w-full aspect-[3/1] rounded-xl' : 'w-24 h-24 rounded-full'}`}>
      {value ? <img src={value} alt={label} className="w-full h-full object-cover" /> : <Camera size={24} className="text-muted" />}
    </button>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={select} className="hidden" aria-label={`Choose ${label.toLowerCase()}`} />
    <div className="flex gap-3"><button type="button" disabled={disabled} className="btn-ghost" onClick={() => input.current?.click()}>{value ? 'Change photo' : 'Upload photo'}</button>{value && <button type="button" disabled={disabled} className="btn-ghost" onClick={() => { onChange(''); setMessage('Save your profile to remove this photo.') }}>Remove</button>}</div>
    {message && <p role="status" className="text-xs text-muted">{message}</p>}
    {source && createPortal(<AvatarCropModal imageSrc={source} aspect={cover ? 3 : 1} onCancel={() => setSource(null)} onConfirm={upload} />, document.body)}
  </div>
}
