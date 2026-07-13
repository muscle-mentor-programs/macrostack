/* Where the app is running. The same web build ships to the website, the
   installed PWA, and the native iOS shell (Capacitor) — these flags let the
   few Apple-specific rules (no external purchase UI in the App Store build)
   branch at runtime. On the website and PWA both are always false. */
import { Capacitor } from '@capacitor/core'

export const isNativeApp = Capacitor.isNativePlatform()
export const isNativeIOS = isNativeApp && Capacitor.getPlatform() === 'ios'
