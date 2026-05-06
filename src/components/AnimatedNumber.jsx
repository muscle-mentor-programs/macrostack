import { useCountUp } from '../hooks/useCountUp'

/**
 * Animates a number from 0 → value on mount (or when value changes).
 * Inherits any className/style from the parent via spread.
 */
export default function AnimatedNumber({
  value = 0,
  decimals = 0,
  duration = 900,
  delay = 0,
  className = '',
  suffix = '',
  prefix = '',
}) {
  const animated = useCountUp(value, duration, delay)
  return (
    <span className={`data-flicker ${className}`}>
      {prefix}{animated.toFixed(decimals)}{suffix}
    </span>
  )
}
