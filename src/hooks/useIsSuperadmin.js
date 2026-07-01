import useStore from '../store'

/**
 * True only when the signed-in account is a superadmin AND they're currently in
 * the Superadmin Portal (portalMode === 'superadmin'). In the Coach Portal a
 * superadmin behaves like a regular coach, so all admin-only features hide.
 */
export default function useIsSuperadmin() {
  return useStore((s) => s.currentUser?.role === 'superadmin' && s.portalMode === 'superadmin')
}
