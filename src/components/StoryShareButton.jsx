import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Share2, X, Download, Camera, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { canShareImage, renderStoryCanvas, readStoryPhoto, storySnapshot, storyPageCount } from '../lib/storyImage'
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
  const preview = useRef(null)
  const [previewReady, setPreviewReady] = useState(false)
  const [page, setPage] = useState(0)
  const pageCount = storyPageCount(story)
  const selection = useRef({ version: 0 })
  const [photo, setPhoto] = useState(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [generated, setAsset] = useState(null)
  const asset = generated?.page === page && generated?.photo === photo && generated?.position === position && !photoLoading ? generated : null
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
    let timer
    let frame
    if (story.kind === 'meal' && !photo) return
    frame = requestAnimationFrame(() => {
      renderStoryCanvas(story, photo, position, page).then(canvas => {
        if (!alive) return
        preview.current.getContext('2d').drawImage(canvas, 0, 0)
        setPreviewReady(true)
        // Keep the preview mounted while dragging; encode only after input settles.
        timer = setTimeout(() => canvas.toBlob(blob => {
          if (!alive) return
          if (!blob) { setError('Could not create the image. Please retry.'); return }
          url = URL.createObjectURL(blob)
          setAsset({ url, photo, position, page, file: new File([blob], `macrostack-${story.kind}-${story.date}${pageCount > 1 ? `-${page + 1}` : ''}.png`, { type: 'image/png' }) })
        }, 'image/png'), 250)
      }).catch(failure => { if (alive) setError(failure.message || 'Image generation failed. Please retry.') })
    })
    return () => { alive = false; cancelAnimationFrame(frame); clearTimeout(timer); if (url) URL.revokeObjectURL(url) }
  }, [story, attempt, photo, position, page, pageCount])
  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return // Camera/picker cancellation preserves the current photo.
    const version = ++selection.current.version
    setAsset(null); setPhoto(null); setPreviewReady(false); setError(''); setMessage(''); setPhotoLoading(true)
    try {
      const decoded = await readStoryPhoto(file)
      if (version === selection.current.version) { setPhoto(decoded); setPosition({ x: 50, y: 50 }) }
    } catch (failure) { if (version === selection.current.version) setError(failure.message) }
    finally { if (version === selection.current.version) setPhotoLoading(false) }
  }
  function reposition(key, value) {
    setError(''); setPosition(current => ({ ...current, [key]: Number(value) }))
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
      <header><div><h2 id="story-preview-title">{story.kind === 'meal' ? 'SHARE MEAL' : 'SHARE DAILY TOTALS'}</h2><p>{story.kind === 'meal' ? 'Your food. Your recipe. Your stack.' : '1080 × 1920 · Story image'}</p></div><button type="button" className="story-share-trigger" aria-label="Close share preview" onClick={onClose}><X size={20} /></button></header>
      <div className="story-share-content">
        {story.kind === 'meal' && <div className="story-photo-controls">
          {!photo && <div className="story-photo-intro"><h3>Good food. Worth sharing.</h3><p>Add your photo. We’ll include your logged foods, quantities, and macros.</p></div>}
          <div className="story-share-actions">
            <button className="story-share-trigger" disabled={sharing || photoLoading} onClick={() => camera.current.click()}><Camera size={16} />{photo ? 'Retake photo' : 'Take photo'}</button>
            <button className="story-share-trigger" disabled={sharing || photoLoading} onClick={() => gallery.current.click()}><ImagePlus size={16} />{photo ? 'Change photo' : 'Choose photo'}</button>
          </div>
          <input ref={camera} aria-label="Take food photo" type="file" accept="image/*" capture="environment" hidden onChange={choosePhoto} />
          <input ref={gallery} aria-label="Choose food photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={choosePhoto} />
        </div>}
        {(photoLoading || ((photo || story.kind === 'daily') && !previewReady && !error)) && <p role="status">{photoLoading ? 'Opening photo…' : 'Creating your Story image…'}</p>}
        {error && <div role="alert"><p>{error}</p>{(photo || story.kind === 'daily') && <button className="story-share-trigger" onClick={() => { setError(''); setAttempt(value => value + 1) }}>Retry</button>}</div>}
        <canvas ref={preview} hidden={!previewReady} role="img" width="1080" height="1920" aria-label={`${story.kind === 'meal' ? story.meal : 'Daily totals'} nutrition Story preview for ${story.date}, card ${page + 1} of ${pageCount}`} />
        {photo && pageCount > 1 && <nav className="story-page-nav" aria-label="Ingredient cards">
          <button type="button" className="story-share-trigger" aria-label="Previous ingredient card" disabled={page === 0 || sharing} onClick={() => setPage(current => current - 1)}><ChevronLeft size={18} /></button>
          <p aria-live="polite">Card {page + 1} of {pageCount}<span>Share each card for the full ingredient list</span></p>
          <button type="button" className="story-share-trigger" aria-label="Next ingredient card" disabled={page === pageCount - 1 || sharing} onClick={() => setPage(current => current + 1)}><ChevronRight size={18} /></button>
        </nav>}
        {photo && <fieldset className="story-photo-position" disabled={sharing}>
          <legend>Adjust photo</legend>
          <label>Left / right<input aria-label="Photo horizontal position" type="range" min="0" max="100" value={position.x} onChange={event => reposition('x', event.target.value)} /></label>
          <label>Up / down<input aria-label="Photo vertical position" type="range" min="0" max="100" value={position.y} onChange={event => reposition('y', event.target.value)} /></label>
        </fieldset>}
      </div>
      {(previewReady || message || story.kind === 'daily') && <footer>
        {story.kind === 'daily' && <p>Review before sharing. Choose Instagram if offered, or download and add the image to your Story. Nothing is posted automatically.</p>}
        {previewReady && <div className="story-share-actions">
          {canShareImage(generated?.file) && <button className="story-share-trigger story-share-primary" disabled={sharing || !asset} onClick={share}><Share2 size={16} />{sharing ? 'Sharing…' : 'Share image'}</button>}
          <a className="story-share-trigger" aria-disabled={!asset} href={asset?.url} download={asset?.file.name} onClick={event => { if (!asset) event.preventDefault() }}><Download size={16} />Download image</a>
        </div>}
        <p role="status">{message}</p>
      </footer>}
    </div>
  </dialog>
}
