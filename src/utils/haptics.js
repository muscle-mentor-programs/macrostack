/**
 * Haptic feedback helpers — fire-and-forget, safe everywhere.
 * Uses the Vibration API (Android Chrome / PWA). iOS Safari ignores it
 * silently, so callers never need to feature-check.
 */
export function tapHaptic()     { try { navigator.vibrate?.(8) }        catch { /* no-op */ } }
export function successHaptic() { try { navigator.vibrate?.([10, 40, 14]) } catch { /* no-op */ } }
export function deleteHaptic()  { try { navigator.vibrate?.(18) }       catch { /* no-op */ } }
