import { supabase } from './supabase'

/** fetch() for our /api routes — attaches the Supabase session token so the
 *  server can verify the caller (all endpoints now require auth). */
export default async function apiFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
