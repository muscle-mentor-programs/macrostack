import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Share2, X, Download, Camera, ImagePlus } from 'lucide-react'
import { canShareImage, generateStoryImage, readStoryPhoto, storySnapshot } from '../lib/storyImage'
import './StoryShareButton.css'

export default function StoryShareButton({ getStory, label = 'Share', compact = false, disabled = false }) {
  const [story, setStory] = useState(null)
  const [error, setError] = useState('')
  return <>
    <button type="button" className={`story-share-trigger ${compact ? 'story-share-compact' : ''}`} disabled={disabled}
      aria-label={label} title={label} onClick={() => {
        try { setStory(storySnapshot(getStory())); setError('') }
        catch (failure) { setError(failure.message || 'This meal could not be shared.') }
      }}><Share2 size={16} />{!compact && <span>{label}</span>}</button>
    {error && <span role="alert" className="text-sm text-red-400">{error}</span>}
    {story && createPortal(<StoryPreview story={story} onClose={() => setStory(null)} />, document.body)}
  </>
}

function StoryPreview({ story, onClose }) {
  const dialog = useRef(null)
  const camera = useRef(null)
  const gallery = useRef(null)
  const selection = useRef({ version: 0 })
  const [photo, setPhoto] = useState(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [generated, setAsset] = useState(null)
  const asset = generated?.photo === photo && generated?.position === position && !photoLoading ? generated : null
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const element = dialog.current
    const pending = selection.current
    element.showModal()
    return () => { pending.version++; element.close() }
  }, [])
  useEffect(() => {
    let alive = true
    let url
    if (!photo) return
    generateStoryImage(story, photo, position).then(blob => {
      if (!alive) return
      url = URL.createObjectURL(blob)
      setAsset({ url, photo, position, file: new File([blob], `macrostack-${story.kind}-${story.date}.png`, { type: 'image/png' }) })
    }).catch(failure => { if (alive) setError(failure.message || 'Image generation failed. Please retry.') })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [story, attempt, photo, position])
  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return // Camera/picker cancellation preserves the current photo.
    const version = ++selection.current.version
    setAsset(null); setPhoto(null); setError(''); setMessage(''); setPhotoLoading(true)
    try {
      const decoded = await readStoryPhoto(file)
      if (version === selection.current.version) { setPhoto(decoded); setPosition({ x: 50, y: 50 }) }
    } catch (failure) { if (version === selection.current.version) setError(failure.message) }
    finally { if (version === selection.current.version) setPhotoLoading(false) }
  }
  function reposition(key, value) {
    setAsset(null); setError(''); setPosition(current => ({ ...current, [key]: Number(value) }))
  }
  const supported = canShareImage(asset?.file)
  async function share() {
    if (!supported || sharing) return
    setSharing(true); setMessage('')
    try {
      await navigator.share({ files: [asset.file] })
      setMessage('Image handed to your device’s share sheet. Finish posting in the app you choose.')
    } catch (failure) {
      setMessage(failure.name === 'AbortError' ? 'Sharing closed. You can try again or download the image.' : 'Sharing is unavailable here. Download the image, then add it to your Story in Instagram.')
    } finally { setSharing(false) }
  }
  return <dialog ref={dialog} className="story-share-dialog" aria-labelledby="story-preview-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="story-share-shell">
      <header><div><h2 id="story-preview-title">{story.kind === 'meal' ? 'SHARE MEAL' : 'SHARE DAILY TOTALS'}</h2><p>1080 × 1920 · Story image</p></div><button type="button" className="story-share-trigger" aria-label="Close share preview" onClick={onClose}><X size={20} /></button></header>
      <div className="story-share-content">
        <div className="story-photo-controls">
          <p>A food photo is required. Keep the food centered; the numbers sit below it. Photos stay on your device.</p>
          <div className="story-share-actions">
            <button className="story-share-trigger" disabled={sharing || photoLoading} onClick={() => camera.current.click()}><Camera size={16} />{photo ? 'Retake photo' : 'Take photo'}</button>
            <button className="story-share-trigger" disabled={sharing || photoLoading} onClick={() => gallery.current.click()}><ImagePlus size={16} />{photo ? 'Change photo' : 'Choose photo'}</button>
          </div>
          <input ref={camera} aria-label="Take food photo" type="file" accept="image/*" capture="environment" hidden onChange={choosePhoto} />
          <input ref={gallery} aria-label="Choose food photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={choosePhoto} />
          <p>Your phone may open its camera or photo picker. If camera access is unavailable, choose an existing photo.</p>
        </div>
        {(photoLoading || (photo && !asset && !error)) && <p role="status">{photoLoading ? 'Opening photo…' : 'Creating your Story image…'}</p>}
        {error && <div role="alert"><p>{error}</p>{photo && <button className="story-share-trigger" onClick={() => { setError(''); setAttempt(value => value + 1) }}>Retry</button>}</div>}
        {asset && <img src={asset.url} width="1080" height="1920" alt={`${story.kind === 'meal' ? story.meal : 'Daily totals'} nutrition Story preview for ${story.date}`} />}
        {photo && <fieldset className="story-photo-position" disabled={sharing}>
          <legend>Position the food in the clear center</legend>
          <label>Left / right<input aria-label="Photo horizontal position" type="range" min="0" max="100" value={position.x} onChange={event => reposition('x', event.target.value)} /></label>
          <label>Up / down<input aria-label="Photo vertical position" type="range" min="0" max="100" value={position.y} onChange={event => reposition('y', event.target.value)} /></label>
        </fieldset>}
      </div>
      <footer>
        <p>Review before sharing. Choose Instagram if offered, or download and add the image to your Story. Nothing is posted automatically.</p>
        {asset && <div className="story-share-actions">
          {supported && <button className="story-share-trigger story-share-primary" disabled={sharing} onClick={share}><Share2 size={16} />{sharing ? 'Sharing…' : 'Share image'}</button>}
          <a className="story-share-trigger" href={asset.url} download={asset.file.name}><Download size={16} />Download image</a>
        </div>}
        <p role="status">{message}</p>
      </footer>
    </div>
  </dialog>
}
