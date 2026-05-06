import { useState, useEffect, useRef } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&?@'

/**
 * Scrambles `text` from random characters, resolving left-to-right to the real value.
 * @param {string} text     - Final text to resolve to
 * @param {number} duration - Total animation time in ms (default 1100)
 * @param {number} delay    - Delay before starting in ms (default 0)
 */
export function useScramble(text, duration = 1100, delay = 0) {
  const [output, setOutput] = useState(
    () => text.split('').map((c) => (c === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)])).join('')
  )
  const intervalRef = useRef()
  const timeoutRef = useRef()

  useEffect(() => {
    clearInterval(intervalRef.current)
    clearTimeout(timeoutRef.current)

    let frame = 0
    const fps = 30
    const totalFrames = Math.round((duration / 1000) * fps)
    const intervalMs = 1000 / fps

    const run = () => {
      intervalRef.current = setInterval(() => {
        frame++
        const revealedCount = Math.floor((frame / totalFrames) * text.length)

        setOutput(
          text.split('').map((char, i) => {
            if (char === ' ') return ' '
            if (i < revealedCount) return char
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          }).join('')
        )

        if (frame >= totalFrames) {
          clearInterval(intervalRef.current)
          setOutput(text)
        }
      }, intervalMs)
    }

    timeoutRef.current = setTimeout(run, delay)

    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(timeoutRef.current)
    }
  }, [text, duration, delay])

  return output
}
