import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CoachCodeBadge({ code }) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef(null)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return <button type="button" className="coach-code-card" onClick={copyCode} aria-label={`Copy coach code ${code}`} title="Copy coach code">
    <span className="coach-code-label">CODE</span>
    <strong>{code}</strong>
    {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
    <span className="sr-only" role="status">{copied ? 'Coach code copied' : ''}</span>
  </button>
}
