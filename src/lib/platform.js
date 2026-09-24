/* The same build runs in a browser, an installed web app, and the native shell. */
import { Capacitor } from '@capacitor/core'

export const isNativeApp = Capacitor.isNativePlatform()
export const isNativeIOS = isNativeApp && Capacitor.getPlatform() === 'ios'
export const isInstalledPWA = !isNativeApp && typeof window !== 'undefined' && Boolean(
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
)
