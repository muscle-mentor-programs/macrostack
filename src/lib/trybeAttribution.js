const STORE_ID = '0e887765-0edf-4b93-9d45-b709d1262196'

export function getTrybeVisitorId() {
  if (typeof window === 'undefined') return null
  try {
    if (localStorage.getItem('macrostack-affiliate-tracking') !== 'accepted') return null
    const fromPixel = window.trybe?.getVisitorId?.()
    const fromCookie = document.cookie.split('; ').find((part) => part.startsWith(`ugc_vid_${STORE_ID}=`))?.split('=')[1]
    const visitorId = fromPixel || (fromCookie && decodeURIComponent(fromCookie))
    return typeof visitorId === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(visitorId) ? visitorId : null
  } catch {
    // Affiliate tracking must never prevent a normal subscription checkout.
    return null
  }
}
