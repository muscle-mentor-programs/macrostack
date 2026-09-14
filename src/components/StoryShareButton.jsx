import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Share2, X, Download } from 'lucide-react'
import { canShareImage, generateStoryImage, storySnapshot } from '../lib/storyImage'
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
  const [asset, setAsset] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  useEffect(() => {
    let alive = true
    let url
    generateStoryImage(story).then(blob => {
      if (!alive) return
      url = URL.createObjectURL(blob)
      setAsset({ url, file: new File([blob], `macrostack-${story.kind}-${story.date}.png`, { type: 'image/png' }) })
    }).catch(failure => { if (alive) setError(failure.message || 'Image generation failed. Please retry.') })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [story, attempt])
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
        {!asset && !error && <p role="status">Creating your Story image…</p>}
        {error && <div role="alert"><p>{error}</p><button className="story-share-trigger" onClick={() => { setError(''); setAttempt(value => value + 1) }}>Retry</button></div>}
        {asset && <img src={asset.url} width="1080" height="1920" alt={`${story.kind === 'meal' ? story.meal : 'Daily totals'} nutrition Story preview for ${story.date}`} />}
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
