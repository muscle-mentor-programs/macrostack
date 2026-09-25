import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BrowserQRCodeReader } from '@zxing/browser'
import { ArrowRight, Camera, Check, Flashlight, ImagePlus, Keyboard, Loader2, RotateCcw, ScanLine, Store, UserRound, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { joinInfo } from '../retail/api'
import { parseConnectionQR } from '../lib/connectionQr'
import './ConnectionScanner.css'

export default function ConnectionScanner({ initialValue, hasCoach, onLinkCoach, onLinked, onClose }) {
  const [stage, setStage] = useState(initialValue ? 'review' : 'camera')
  const [cameraState, setCameraState] = useState('starting')
  const [cameraError, setCameraError] = useState('')
  const [error, setError] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const videoRef = useRef(null)
  const fileRef = useRef(null)
  const controlsRef = useRef(null)
  const lookupRef = useRef(0)

  const resolveValue = useCallback(async (raw) => {
    const request = ++lookupRef.current
    const match = parseConnectionQR(raw, window.location.origin)
    if (!match) {
      setTarget(null)
      setError('This is not a MacroStack coach or store QR code. Try another code or paste a connection link.')
      setStage('manual')
      return
    }
    setError('')
    setTarget({ ...match, loading: true })
    setStage('review')
    try {
      let name
      let subtitle
      if (match.kind === 'coach') {
        if (!supabase) throw new Error('The account service is unavailable. Please try again.')
        const { data, error: lookupError } = await supabase.rpc('get_coach_by_code', { p_code: match.code })
        if (lookupError) throw lookupError
        name = data?.[0]?.name
        subtitle = 'Nutrition coach'
      } else {
        const info = await joinInfo(match.code)
        name = info?.name
        subtitle = info?.organization || 'Retail store'
      }
      if (!name) throw new Error(match.kind === 'coach' ? 'This coach code is not active.' : 'This store QR code is not active.')
      if (lookupRef.current === request) setTarget({ ...match, name, subtitle })
    } catch (lookupError) {
      if (lookupRef.current !== request) return
      setTarget(null)
      setError(lookupError.message || 'Could not verify this QR code. Please try again.')
      setStage('manual')
    }
  }, [])

  useEffect(() => {
    let active = true
    if (initialValue) queueMicrotask(() => { if (active) resolveValue(initialValue) })
    return () => { active = false; lookupRef.current += 1 }
  }, [initialValue, resolveValue])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => { if (event.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [busy, onClose])

  useEffect(() => {
    if (stage !== 'camera') return
    let disposed = false
    const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 180 })
    reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false },
      videoRef.current,
      (result, _error, controls) => {
        if (!result || disposed) return
        disposed = true
        controls.stop()
        resolveValue(result.getText())
      },
    ).then((controls) => {
      if (disposed) { controls.stop(); return }
      controlsRef.current = controls
      setTorchAvailable(Boolean(controls.switchTorch))
      setCameraState('ready')
    }).catch((cameraFailure) => {
      if (disposed) return
      setCameraState('error')
      setCameraError(cameraFailure?.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow access in your browser settings, or use a saved QR image.'
        : 'The camera could not start. You can upload a QR image or paste a connection link.')
    })
    return () => {
      disposed = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [stage, resolveValue])

  const scanAgain = () => {
    lookupRef.current++
    setTarget(null)
    setError('')
    setCameraState('starting')
    setCameraError('')
    setTorchAvailable(false)
    setTorchOn(false)
    setStage('camera')
  }

  const scanImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) {
      setError('Choose an image smaller than 15 MB.')
      setStage('manual')
      return
    }
    setStage('upload')
    setError('')
    const url = URL.createObjectURL(file)
    try {
      const result = await new BrowserQRCodeReader().decodeFromImageUrl(url)
      await resolveValue(result.getText())
    } catch {
      setError('No readable QR code was found in that image. Try a clearer photo or paste the link.')
      setStage('manual')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const toggleTorch = async () => {
    if (!controlsRef.current?.switchTorch) return
    try {
      await controlsRef.current.switchTorch(!torchOn)
      setTorchOn(value => !value)
    } catch {
      setCameraError('This camera does not support the flashlight.')
      setTorchAvailable(false)
    }
  }

  const continueConnection = async () => {
    if (!target || target.loading || busy) return
    if (target.kind === 'store') {
      const url = new URL('/retail/member', window.location.origin)
      url.searchParams.set('store', target.code)
      window.location.assign(url.toString())
      return
    }
    if (hasCoach) return
    setBusy(true)
    setError('')
    try {
      const result = await onLinkCoach(target.code)
      if (!result?.ok) throw new Error(result?.error || 'Could not link to this coach.')
      onLinked(result.coachName || target.name)
      onClose()
    } catch (linkError) {
      setError(linkError.message || 'Could not link to this coach. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(<div className="connection-scan-backdrop">
    <section className="connection-scan-panel" role="dialog" aria-modal="true" aria-labelledby="connection-scan-title">
      <header className="connection-scan-header">
        <div className="connection-scan-mark"><ScanLine size={20} /></div>
        <div className="min-w-0 flex-1">
          <p className="connection-scan-eyebrow">MACROSTACK CONNECT</p>
          <h2 id="connection-scan-title">Scan a QR code</h2>
        </div>
        <button type="button" className="connection-scan-close" aria-label="Close QR scanner" onClick={onClose} disabled={busy} autoFocus><X size={18} /></button>
      </header>

      {stage === 'camera' && <>
        <div className="connection-scan-viewfinder">
          <video ref={videoRef} autoPlay muted playsInline aria-label="QR scanner camera preview" />
          <div className="connection-scan-shade" aria-hidden="true" />
          <div className="connection-scan-frame" aria-hidden="true"><span /><span /><span /><span /><i /></div>
          {cameraState !== 'ready' && <div className="connection-scan-camera-status" role="status">
            {cameraState === 'starting' ? <><Loader2 size={23} className="animate-spin" /> Starting camera…</> : <><Camera size={23} /> Camera unavailable</>}
          </div>}
        </div>
        <p className="connection-scan-instruction">Position a coach or store QR code inside the frame.</p>
        {cameraError && <p className="connection-scan-error" role="alert">{cameraError}</p>}
        {torchAvailable && <button type="button" className="connection-scan-torch" onClick={toggleTorch}><Flashlight size={16} /> {torchOn ? 'Turn light off' : 'Turn light on'}</button>}
      </>}

      {stage === 'upload' && <div className="connection-scan-working" role="status"><Loader2 size={26} className="animate-spin" /><p>Reading QR image…</p></div>}

      {stage === 'manual' && <form className="connection-scan-manual" onSubmit={(event) => { event.preventDefault(); resolveValue(manualValue) }}>
        <div className="connection-scan-manual-icon"><Keyboard size={24} /></div>
        <h3>Enter a connection link</h3>
        <p>Paste a MacroStack QR link, a coach code, or a store code.</p>
        <label htmlFor="connection-scan-input">Code or link</label>
        <input id="connection-scan-input" value={manualValue} onChange={event => setManualValue(event.target.value)} placeholder="Paste link or enter code" autoComplete="off" />
        <button type="submit" className="connection-scan-primary" disabled={!manualValue.trim()}>Review connection <ArrowRight size={16} /></button>
      </form>}

      {stage === 'review' && <div className="connection-scan-review">
        {target?.loading ? <div className="connection-scan-working" role="status"><Loader2 size={26} className="animate-spin" /><p>Verifying connection…</p></div> : target && <>
          <div className="connection-scan-review-icon">{target.kind === 'coach' ? <UserRound size={28} /> : <Store size={28} />}</div>
          <p className="connection-scan-eyebrow">{target.kind === 'coach' ? 'COACH QR VERIFIED' : 'STORE QR VERIFIED'}</p>
          <h3>{target.name}</h3>
          <p className="connection-scan-subtitle">{target.subtitle}</p>
          <div className="connection-scan-verified"><Check size={15} /> MacroStack connection found</div>
          {hasCoach && target.kind === 'coach' ? <p className="connection-scan-error" role="alert">You’re already linked to a coach. Unlink in Profile before connecting to another.</p> :
            <button type="button" className="connection-scan-primary" disabled={busy} onClick={continueConnection}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Connecting…</> : <>{target.kind === 'coach' ? 'Link to this coach' : 'Review store connection'} <ArrowRight size={16} /></>}
            </button>}
          {target.kind === 'store' && <p className="connection-scan-consent">You’ll review what the store can access before confirming.</p>}
        </>}
      </div>}

      {error && <p className="connection-scan-error" role="alert">{error}</p>}

      <footer className="connection-scan-footer">
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Choose QR image" onChange={scanImage} />
        <button type="button" onClick={() => fileRef.current?.click()}><ImagePlus size={17} /> Upload image</button>
        {stage === 'camera' ? <button type="button" onClick={() => setStage('manual')}><Keyboard size={17} /> Enter code</button> :
          <button type="button" onClick={scanAgain}><RotateCcw size={17} /> Scan again</button>}
      </footer>
    </section>
  </div>, document.body)
}
