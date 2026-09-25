import { supabase } from './supabase'
import { isNativeApp } from './platform'

const nativeApiOrigin = (import.meta.env.VITE_API_ORIGIN || 'https://www.getmacrostack.com').replace(/\/$/, '')

/** fetch() for our /api routes, attaches the Supabase session token so the
 *  server can verify the caller (all endpoints now require auth). */
export default async function apiFetch(url, options = {}) {
  const requestUrl = isNativeApp && url.startsWith('/api/') ? `${nativeApiOrigin}${url}` : url
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return fetch(requestUrl, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
