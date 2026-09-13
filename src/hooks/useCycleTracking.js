import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Component memory only: never put reproductive-health data in the persisted store.
export default function useCycleTracking(userId) {
  const [state, setState] = useState({ owner: null, enabled: false, periods: [], loading: true, error: '' })
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    let alive = true
    if (!userId) return
    async function load() {
      try {
        if (!supabase) throw new Error('Unavailable')
        const settings = await supabase.from('cycle_tracking_settings').select('enabled').eq('user_id', userId).maybeSingle()
        if (settings.error) throw settings.error
        const periods = []
        // Paginate rather than silently losing older entries at the API row limit.
        for (let offset = 0; ; offset += 500) {
          const result = await supabase.from('cycle_periods').select('id,start_date,end_date,symptoms,notes')
            .eq('user_id', userId).order('start_date', { ascending: false }).range(offset, offset + 499)
          if (result.error) throw result.error
          periods.push(...result.data)
          if (result.data.length < 500) break
        }
        if (alive) setState({ owner: userId, enabled: settings.data?.enabled || false, periods, loading: false, error: '' })
      } catch {
        if (alive) setState({ owner: userId, enabled: false, periods: [], loading: false, error: 'Cycle tracking could not load. Please retry. If this is a new feature, setup may still be pending.' })
      }
    }
    load()
    return () => { alive = false }
  }, [userId, revision])
  return { ...(state.owner === userId ? state : { enabled: false, periods: [], loading: Boolean(userId), error: '' }), reload }
}
