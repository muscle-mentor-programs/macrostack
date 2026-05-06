import { useScramble } from '../hooks/useScramble'

/**
 * Renders text that scrambles from random chars → real text on mount.
 */
export default function ScrambleText({
  text,
  className = '',
  duration = 1100,
  delay = 0,
  tag: Tag = 'span',
}) {
  const output = useScramble(text, duration, delay)
  return <Tag className={className}>{output}</Tag>
}
