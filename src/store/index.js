import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { coachClientLimit } from '../lib/coachTiers'

const today = () => format(new Date(), 'yyyy-MM-dd')

// ─── Subscription helpers ────────────────────────────────────────────────────

// Effective access: superadmin override beats Stripe status (so a webhook can
// never undo a manual unlock). Superadmins always have full access.
export function computeSubscriptionAccess(profile) {
  if (!profile) return false
  if (profile.role === 'superadmin') return true
  if (profile.admin_override === 'unlocked') return true
  if (profile.admin_override === 'locked')   return false
  return profile.subscription_status === 'active' || profile.subscription_status === 'trialing'
}

// profile row (from get_my_profile) + email → currentUser store shape
function profileToUser(profile, email) {
  return {
    id:          profile.id,
    name:        profile.name,
    email,
    role:        profile.role,
    coachCode:   profile.coach_code   || null,
    bio:         profile.bio          || '',
    specialties: profile.specialties  || '',
    credentials: profile.credentials  || '',
    website:     profile.website      || '',
    // Subscription
    subscriptionStatus: profile.subscription_status || 'inactive',
    subscriptionPlan:   profile.subscription_plan   || null,
    currentPeriodEnd:   profile.current_period_end  || null,
    adminOverride:      profile.admin_override       || null,
    hasAccess:          computeSubscriptionAccess(profile),
  }
}

// ─── DB row → store shape transformers ───────────────────────────────────────

function dbToClient(row) {
  return {
    id:               row.id,
    profileId:        row.profile_id   || null,
    coachId:          row.coach_id     || null,
    name:             row.name         || '',
    email:            row.email        || '',
    height:           row.height       || '',
    dob:              row.dob          || '',
    phone:            row.phone        || '',
    bio:              row.bio          || '',
    goals: {
      calories: row.goal_calories ?? 2000,
      protein:  row.goal_protein  ?? 150,
      carbs:    row.goal_carbs    ?? 200,
      fat:      row.goal_fat      ?? 65,
    },
    activeMealPlanId: row.active_meal_plan_id || null,
    avatarUrl:        row.avatar_url || null,
    status:           row.status || 'active',
    createdAt:        row.created_at,
    remindersEnabled: row.reminders_enabled ?? true,
    log:       {},
    weightLog: [],
    mealPlans: [],
    checkins:  [],
    photos:    [],
    submissions: [],
  }
}

function dbToCheckin(row) {
  return {
    id:        row.id,
    weight:    row.weight,
    weightUnit: row.weight_unit || 'lbs',
    adherence: row.adherence,
    hunger:    row.hunger,
    energy:    row.energy,
    notes:     row.notes || '',
    answers:   Array.isArray(row.answers) ? row.answers : [],
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
    reviewed:  row.reviewed ?? true, // pre-migration rows count as seen
    createdAt: row.created_at,
  }
}

function dbToForm(row) {
  return {
    id:          row.id,
    kind:        row.kind || 'custom',
    title:       row.title || '',
    description: row.description || '',
    questions:   Array.isArray(row.questions) ? row.questions : [],
    allowPhotos: row.allow_photos ?? false,
    active:      row.active ?? true,
    createdAt:   row.created_at,
  }
}

function dbToSubmission(row) {
  return {
    id:        row.id,
    formId:    row.form_id,
    formKind:  row.form_kind || 'custom',
    formTitle: row.form_title || '',
    answers:   Array.isArray(row.answers) ? row.answers : [],
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
    reviewed:  row.reviewed ?? false,
    createdAt: row.created_at,
  }
}

function dbToQuestion(row) {
  return {
    id:    row.id,
    label: row.label,
    type:  row.type || 'scale',
    low:   row.low_label  || '',
    high:  row.high_label || '',
    slug:  row.slug || null,
  }
}

function dbToPhoto(row) {
  return {
    id:        row.id,
    url:       row.url,
    path:      row.path,
    note:      row.note || '',
    takenAt:   row.taken_at,
    createdAt: row.created_at,
  }
}

function dbToEntry(row) {
  return {
    id:          row.id,
    date:        row.date,
    name:        row.name,
    brand:       row.brand        || '',
    foodId:      row.food_id      || null,
    quantity:    row.quantity     ?? 1,
    servingSize: row.serving_size || null,
    servingUnit: row.serving_unit || null,
    meal:        row.meal         || 'Other',
    calories:    row.calories     ?? 0,
    protein:     row.protein      ?? 0,
    carbs:       row.carbs        ?? 0,
    fat:         row.fat          ?? 0,
  }
}

function dbToWeight(row) {
  return { id: row.id, value: row.value, unit: row.unit || 'lbs', date: row.date }
}

function dbToPlan(row) {
  return { id: row.id, planName: row.plan_name, days: row.days || [], createdAt: row.created_at }
}

function dbToMessage(row) {
  return {
    id:            row.id,
    from:          row.from_role,
    text:          row.text,
    timestamp:     row.created_at,
    readByCoach:   row.read_by_coach,
    readByClient:  row.read_by_client,
  }
}

function dbToFood(row) {
  return {
    id:          row.id,
    name:        row.name,
    brand:       row.brand        || '',
    servingSize: row.serving_size || null,
    servingUnit: row.serving_unit || null,
    calories:    row.calories     ?? 0,
    protein:     row.protein      ?? 0,
    carbs:       row.carbs        ?? 0,
    fat:         row.fat          ?? 0,
    upc:         row.upc          || null,
    source:      row.source       || 'custom',
  }
}

const calcTotals = (entries = []) =>
  entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein:  acc.protein  + (e.protein  || 0),
      carbs:    acc.carbs    + (e.carbs    || 0),
      fat:      acc.fat      + (e.fat      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

// ─── Store ───────────────────────────────────────────────────────────────────

const useStore = create(
  persist(
    (set, get) => ({

      // ── AUTH ──────────────────────────────────────────────────────────────
      isAuthenticated: false,
      authLoading:     true,   // true while initial session check is in flight
      currentUser:     null,   // { id, name, email, role, coachCode }

      initAuth: async () => {
        if (!supabase) { set({ authLoading: false, isAuthenticated: false }); return }
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          set({ authLoading: false, isAuthenticated: false })
          return
        }

        const { data: profileRows } = await supabase.rpc('get_my_profile')
        const profile = profileRows?.[0] ?? null

        if (!profile) {
          await supabase.auth.signOut()
          set({ authLoading: false, isAuthenticated: false })
          return
        }

        const currentUser = profileToUser(profile, session.user.email)

        await get().loadAllData()

        const update = { isAuthenticated: true, currentUser, authLoading: false }

        if (profile.role === 'client') {
          const clientProfile = get().clients.find(
            (c) => c.email?.toLowerCase() === session.user.email.toLowerCase()
          )
          if (clientProfile) {
            update.activeRole     = 'client'
            update.activeClientId = clientProfile.id
            update.activePage     = 'dashboard'
            if (clientProfile.coachId) {
              // load coach profile async — don't await so auth finishes fast
              setTimeout(() => get().loadCoachProfile(clientProfile.coachId), 0)
            }
          }
        }

        set(update)

        // Keep session in sync across tabs — subscribe exactly once even if
        // initAuth re-runs (HMR, re-mount), otherwise listeners accumulate
        if (!get()._authListenerAttached) {
          set({ _authListenerAttached: true })
          supabase?.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
              set({
                isAuthenticated: false, currentUser: null,
                activeRole: null, activeClientId: null,
                clients: [], messages: {}, customFoods: [], scannedFoods: [], overrideFoods: [], hiddenFoodIds: [],
                coachProfile: null,
              })
            }
          })
        }
      },

      login: async (email, password, edition = null) => {
        if (!supabase) return { ok: false, error: 'Supabase is not configured. Check environment variables.' }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(), password,
        })
        if (error) return { ok: false, error: 'Invalid email or password.' }

        const { data: profileRows, error: profileErr } = await supabase.rpc('get_my_profile')
        const profile = profileRows?.[0] ?? null

        if (!profile) {
          console.error('[login] get_my_profile failed:', profileErr)
          await supabase.auth.signOut()
          return { ok: false, error: profileErr?.message || 'Account not configured. Contact your coach.' }
        }

        if (edition === 'coach' && profile.role === 'client') {
          await supabase.auth.signOut()
          return { ok: false, error: 'This account requires the User Edition.' }
        }
        if (edition === 'client' && profile.role !== 'client') {
          await supabase.auth.signOut()
          return { ok: false, error: 'This account requires the Coach Edition.' }
        }

        const currentUser = profileToUser(profile, data.user.email)

        await get().loadAllData()

        const update = { isAuthenticated: true, currentUser }

        if (profile.role === 'client') {
          const clientProfile = get().clients.find(
            (c) => c.email?.toLowerCase() === email.toLowerCase()
          )
          if (clientProfile) {
            update.activeRole     = 'client'
            update.activeClientId = clientProfile.id
            update.activePage     = 'dashboard'
            if (clientProfile.coachId) {
              setTimeout(() => get().loadCoachProfile(clientProfile.coachId), 0)
            }
          }
        }

        set(update)
        return { ok: true }
      },

      logout: async () => {
        if (supabase) await supabase.auth.signOut()
        set({
          isAuthenticated: false, currentUser: null,
          activeRole: null, activeClientId: null,
          clients: [], messages: {}, customFoods: [], scannedFoods: [], overrideFoods: [], hiddenFoodIds: [],
          coachProfile: null,
        })
      },

      // ── DATA LOADING ──────────────────────────────────────────────────────
      loadAllData: async () => {
        // All four queries run in parallel — cuts login latency to the slowest
        // single query instead of the sum of all four
        let [clientRes, msgRes, foodRes, reqRes] = await Promise.all([
          supabase.from('clients')
            .select('*, food_log(*), weight_log(*), meal_plans(*), checkins(*), progress_photos(*), form_submissions(*)')
            .order('created_at', { ascending: true }),
          supabase.from('messages').select('*').order('created_at', { ascending: true }),
          supabase.from('custom_foods').select('*').order('created_at', { ascending: true }),
          supabase.from('coach_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        ])

        // Graceful fallbacks while newer migrations haven't run yet — don't
        // let a missing table take down all client data.
        if (clientRes.error) {
          clientRes = await supabase.from('clients')
            .select('*, food_log(*), weight_log(*), meal_plans(*), checkins(*), progress_photos(*)')
            .order('created_at', { ascending: true })
        }
        if (clientRes.error) {
          clientRes = await supabase.from('clients')
            .select('*, food_log(*), weight_log(*), meal_plans(*), checkins(*)')
            .order('created_at', { ascending: true })
        }

        if (clientRes.error) console.error('loadAllData clients:', clientRes.error)
        if (msgRes.error)    console.error('loadAllData messages:', msgRes.error)
        if (foodRes.error)   console.error('loadAllData foods:', foodRes.error)
        if (reqRes.error)    console.error('loadAllData requests:', reqRes.error)

        let clients = (clientRes.data || []).map((row) => {
          // Group food_log entries by date
          const log = {}
          ;(row.food_log || []).forEach((e) => {
            if (!log[e.date]) log[e.date] = []
            log[e.date].push(dbToEntry(e))
          })
          return {
            ...dbToClient(row),
            log,
            weightLog: (row.weight_log || [])
              .map(dbToWeight)
              .sort((a, b) => a.date.localeCompare(b.date)),
            mealPlans: (row.meal_plans || []).map(dbToPlan),
            checkins: (row.checkins || [])
              .map(dbToCheckin)
              .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
            // Oldest → newest so the timeline reads left-to-right
            photos: (row.progress_photos || [])
              .map(dbToPhoto)
              .sort((a, b) => (a.takenAt || '').localeCompare(b.takenAt || '') ||
                              (a.createdAt || '').localeCompare(b.createdAt || '')),
            submissions: (row.form_submissions || [])
              .map(dbToSubmission)
              .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
          }
        })

        // Coach Portal view for a superadmin: scope to only their own clients.
        // (Superadmin Portal / regular coaches are unaffected — RLS already
        // scopes real coaches to their own roster.)
        const me = get().currentUser
        if (me?.role === 'superadmin' && get().portalMode === 'coach') {
          clients = clients.filter((c) => c.coachId === me.id)
        }

        // Messages grouped by client_id
        const messages = {}
        ;(msgRes.data || []).forEach((row) => {
          if (!messages[row.client_id]) messages[row.client_id] = []
          messages[row.client_id].push(dbToMessage(row))
        })

        const foodRows      = foodRes.data || []
        const customFoods   = foodRows.filter((f) => f.source === 'custom').map(dbToFood)
        const overrideFoods = foodRows.filter((f) => f.source === 'override').map(dbToFood)
        // 'deleted' markers hide a built-in food from the shared database (superadmin action)
        const hiddenFoodIds = foodRows.filter((f) => f.source === 'deleted').map((f) => f.id)
        const scannedFoods  = foodRows
          .filter((f) => f.source !== 'custom' && f.source !== 'override' && f.source !== 'deleted')
          .map(dbToFood)

        set({ clients, messages, customFoods, scannedFoods, overrideFoods, hiddenFoodIds, coachRequests: reqRes.data || [] })
      },

      // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────
      // True while a fresh signup is being sent to Stripe checkout — App holds
      // the redirect screen instead of rendering the app (not persisted).
      checkoutRedirect: false,
      setCheckoutRedirect: (v) => set({ checkoutRedirect: v }),

      adminAccounts: [],
      adminAccountsError: null,
      adminAccountsLoaded: false,

      // Refresh the signed-in user's subscription state (e.g. after returning
      // from Stripe Checkout). Recomputes hasAccess from the latest profile.
      refreshSubscription: async () => {
        const { data, error } = await supabase.rpc('get_my_profile')
        const profile = data?.[0]
        if (error || !profile) return
        set((s) => ({
          currentUser: s.currentUser
            ? { ...s.currentUser, ...profileToUser(profile, s.currentUser.email) }
            : s.currentUser,
        }))
        // Reload client records too — a fresh subscription auto-links the user
        // to their coach (server-side), so coach_id may have just changed.
        await get().loadAllData()
        const me = get()
        const myClient = me.clients.find(
          (c) => c.id === me.activeClientId || c.email?.toLowerCase() === profile?.email?.toLowerCase?.()
        )
        if (myClient?.coachId && !me.coachProfile) {
          get().loadCoachProfile(myClient.coachId)
        }
      },

      // Superadmin: list every account with subscription state
      loadAdminAccounts: async () => {
        const { data, error } = await supabase.rpc('admin_list_accounts')
        if (error) {
          console.error('admin_list_accounts:', error)
          set({ adminAccountsError: error.message || 'Could not load accounts.', adminAccountsLoaded: true })
          return
        }
        set({ adminAccounts: data || [], adminAccountsError: null, adminAccountsLoaded: true })
      },

      // Superadmin: lock / unlock / clear an account's access.
      // value: 'locked' | 'unlocked' | null (null = follow Stripe status)
      setSubscriptionOverride: async (targetId, value) => {
        const { error } = await supabase.rpc('set_subscription_override', {
          target_id: targetId, new_override: value,
        })
        if (error) { console.error('set_subscription_override:', error); return { ok: false } }
        // Optimistically reflect in the admin list
        set((s) => ({
          adminAccounts: s.adminAccounts.map((a) =>
            a.id === targetId ? { ...a, admin_override: value } : a
          ),
          // If the superadmin changed their own override, refresh access
          currentUser: s.currentUser?.id === targetId
            ? { ...s.currentUser, adminOverride: value,
                hasAccess: value === 'unlocked' ? true : value === 'locked' ? false : s.currentUser.hasAccess }
            : s.currentUser,
        }))
        return { ok: true }
      },

      // Start Stripe Checkout for the signed-in user.
      // audience: 'coach' | 'user'  ·  plan: 'monthly' | 'annual'
      startCheckout: async (audience, plan) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return { ok: false, error: 'Not signed in.' }
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ audience, plan, returnUrl: window.location.origin }),
            }
          )
          const json = await res.json().catch(() => ({}))
          if (!res.ok || !json.url) {
            return { ok: false, error: json.error || 'Checkout is not available right now. Please try again later.' }
          }
          window.location.href = json.url
          return { ok: true }
        } catch {
          // Network-level failure: function unreachable / not deployed / CORS
          return { ok: false, error: 'Could not reach checkout. Subscriptions may not be set up yet — please try again later or contact support.' }
        }
      },

      // Switch coach tiers on the existing Stripe subscription (prorated).
      // The edge function re-verifies the client count server-side before a
      // downgrade, so this can't be spoofed from the console.
      changeSubscriptionTier: async (plan) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return { ok: false, error: 'Not signed in.' }
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/change-subscription`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ plan }),
            }
          )
          const json = await res.json().catch(() => ({}))
          if (!res.ok || !json.ok) {
            return { ok: false, error: json.error || 'Could not change your plan. Please try again.' }
          }
          await get().refreshSubscription()
          return { ok: true }
        } catch {
          return { ok: false, error: 'Could not reach the billing service. Please try again.' }
        }
      },

      // Open the Stripe customer portal (manage / cancel).
      openBillingPortal: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return { ok: false }
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ returnUrl: window.location.origin }),
            }
          )
          const json = await res.json()
          if (json.url) { window.location.href = json.url; return { ok: true } }
          return { ok: false }
        } catch { return { ok: false } }
      },

      // ── THEME ─────────────────────────────────────────────────────────────
      theme: 'ocean-dark',
      setTheme: (name) => {
        set({ theme: name })
        const html = document.documentElement
        html.classList.remove('ocean-dark', 'ocean-light')
        html.classList.add(name)
      },

      toggleTheme: () => {
        const { theme } = get()
        const next = theme === 'ocean-dark' ? 'ocean-light' : 'ocean-dark'
        set({ theme: next })
        const html = document.documentElement
        html.classList.remove('ocean-dark', 'ocean-light')
        html.classList.add(next)
      },

      // ── ROLE / NAVIGATION ─────────────────────────────────────────────────
      activeRole:   null,
      setActiveRole: (role) => set({ activeRole: role }),

      // Superadmin portal mode: 'superadmin' = full access to everything;
      // 'coach' = scoped coach experience (own clients only, no admin tools).
      // Session-only (not persisted) — chosen fresh each login via RoleSelector.
      portalMode: 'superadmin',
      setPortalMode: async (mode) => {
        set({ portalMode: mode, activePage: 'dashboard' })
        // Re-load so client scope reflects the new mode.
        await get().loadAllData()
      },

      activePage:   'clients',
      setActivePage: (page) => set({ activePage: page }),

      logDate:   today(),
      setLogDate: (date) => set({ logDate: date }),

      // ── CLIENT MANAGEMENT ─────────────────────────────────────────────────
      clients:          [],
      viewingClientId:  null,
      viewingClientTab: null,
      setViewingClientId: (id, tab = null) => set({ viewingClientId: id, viewingClientTab: tab }),

      addClient: async (data) => {
        // Tier-based client cap — enforced here in the data layer (not just
        // hidden in UI) so the limit can't be clicked past. A DB trigger
        // enforces the same limit server-side for every other path.
        const me = get().currentUser
        const limit = coachClientLimit(me)
        if (me && limit !== null && get().clients.length >= limit) {
          return { id: null, inviteSent: false, capReached: true }
        }

        const hasEmail = Boolean(data.email?.trim())

        const { data: row, error } = await supabase
          .from('clients')
          .insert({
            name:          data.name  || 'New User',
            email:         data.email || '',
            goal_calories: data.goals?.calories ?? 2000,
            goal_protein:  data.goals?.protein  ?? 150,
            goal_carbs:    data.goals?.carbs    ?? 200,
            goal_fat:      data.goals?.fat      ?? 65,
            coach_id:      get().currentUser?.id || null,
            // mark pending until the client accepts the invite and creates an account
            status:        hasEmail ? 'pending' : 'active',
          })
          .select().single()

        if (error) { console.error('addClient:', error); return { id: null, inviteSent: false } }

        const client = { ...dbToClient(row), log: {}, weightLog: [], mealPlans: [] }
        set((s) => ({ clients: [...s.clients, client] }))

        // Send invite email via Supabase Edge Function
        let inviteSent = false
        if (hasEmail) {
          const { error: inviteError } = await supabase.functions.invoke('invite-client', {
            body: { email: data.email.trim(), clientName: data.name || 'there' },
          })
          if (inviteError) {
            console.error('invite-client error:', inviteError)
          } else {
            inviteSent = true
          }
        }

        return { id: row.id, inviteSent }
      },

      // Re-send an invite for a client that is still pending
      resendInvite: async (clientId) => {
        const client = get().clients.find((c) => c.id === clientId)
        if (!client?.email) return
        const { error } = await supabase.functions.invoke('invite-client', {
          body: { email: client.email, clientName: client.name },
        })
        if (error) console.error('resendInvite:', error)
      },

      removeClient: async (id) => {
        await supabase.from('clients').delete().eq('id', id)
        set((s) => ({
          clients:        s.clients.filter((c) => c.id !== id),
          viewingClientId: s.viewingClientId === id ? null : s.viewingClientId,
          activeClientId:  s.activeClientId  === id ? null : s.activeClientId,
        }))
      },

      updateClientInfo: async (clientId, info) => {
        await supabase.from('clients').update({ name: info.name, email: info.email }).eq('id', clientId)
        set((s) => ({
          clients: s.clients.map((c) => c.id === clientId ? { ...c, ...info } : c),
        }))
      },

      updateClientProfile: async (clientId, fields) => {
        const dbFields = {}
        if (fields.name      !== undefined) dbFields.name      = fields.name
        if (fields.height    !== undefined) dbFields.height    = fields.height
        if (fields.dob       !== undefined) dbFields.dob       = fields.dob
        if (fields.phone     !== undefined) dbFields.phone     = fields.phone
        if (fields.bio       !== undefined) dbFields.bio       = fields.bio
        if (fields.avatarUrl !== undefined) dbFields.avatar_url = fields.avatarUrl

        await supabase.from('clients').update(dbFields).eq('id', clientId)
        set((s) => ({
          clients: s.clients.map((c) => c.id === clientId ? { ...c, ...fields } : c),
        }))
      },

      uploadClientAvatar: async (clientId, file) => {
        if (!supabase) return { error: 'Supabase not configured' }
        const ext  = file.name.split('.').pop().toLowerCase()
        const path = `clients/${clientId}.${ext}`

        const { error } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type })

        if (error) { console.error('Avatar upload error:', error); return { error } }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(path)

        // Cache-bust so the browser re-fetches the new image immediately
        const avatarUrl = `${publicUrl}?t=${Date.now()}`

        await supabase.from('clients').update({ avatar_url: publicUrl }).eq('id', clientId)
        set((s) => ({
          clients: s.clients.map((c) => c.id === clientId ? { ...c, avatarUrl } : c),
        }))
        return { avatarUrl }
      },

      // ── REMINDER EMAILS (client opt-in/out) ───────────────────────────────
      setClientReminders: async (clientId, enabled) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, remindersEnabled: enabled } : c
          ),
        }))
        await supabase.from('clients').update({ reminders_enabled: enabled }).eq('id', clientId)
      },

      // ── PROGRESS PHOTOS ───────────────────────────────────────────────────
      addProgressPhoto: async (clientId, file, note = '') => {
        if (!supabase) return { error: 'Supabase not configured' }
        const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `clients/${clientId}/${Date.now()}.${ext}`

        const { error } = await supabase.storage
          .from('progress-photos')
          .upload(path, file, { contentType: file.type })
        if (error) { console.error('Progress photo upload:', error); return { error } }

        const { data: { publicUrl } } = supabase.storage
          .from('progress-photos')
          .getPublicUrl(path)

        const takenAt = today()
        const { data: row, error: insErr } = await supabase
          .from('progress_photos')
          .insert({ client_id: clientId, url: publicUrl, path, note, taken_at: takenAt })
          .select()
          .single()
        if (insErr) { console.error('Progress photo insert:', insErr); return { error: insErr } }

        const photo = {
          id: row.id, url: publicUrl, path, note,
          takenAt: row.taken_at, createdAt: row.created_at,
        }
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, photos: [...(c.photos || []), photo] } : c
          ),
        }))
        return { photo }
      },

      deleteProgressPhoto: async (clientId, photo) => {
        // Optimistic removal
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, photos: (c.photos || []).filter((p) => p.id !== photo.id) }
              : c
          ),
        }))
        await supabase.from('progress_photos').delete().eq('id', photo.id)
        // Storage cleanup is best-effort (returns {error}, never throws)
        if (photo.path) await supabase.storage.from('progress-photos').remove([photo.path])
      },

      updateClientGoals: async (clientId, goals) => {
        await supabase.from('clients').update({
          goal_calories: goals.calories,
          goal_protein:  goals.protein,
          goal_carbs:    goals.carbs,
          goal_fat:      goals.fat,
        }).eq('id', clientId)
        set((s) => ({
          clients: s.clients.map((c) => c.id === clientId ? { ...c, goals } : c),
        }))
      },

      // ── FOOD LOG ──────────────────────────────────────────────────────────
      addClientEntry: async (clientId, entry) => {
        const date = entry.date || today()
        const id   = crypto.randomUUID()

        // Optimistic update (instant UI)
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return { ...c, log: { ...c.log, [date]: [...(c.log[date] || []), { ...entry, id, date }] } }
          }),
        }))

        const { error } = await supabase.from('food_log').insert({
          id, client_id: clientId, date,
          name:         entry.name,
          brand:        entry.brand        || '',
          food_id:      entry.foodId       || null,
          quantity:     entry.quantity     ?? 1,
          serving_size: entry.servingSize  || null,
          serving_unit: entry.servingUnit  || null,
          meal:         entry.meal         || 'Other',
          calories:     entry.calories     ?? 0,
          protein:      entry.protein      ?? 0,
          carbs:        entry.carbs        ?? 0,
          fat:          entry.fat          ?? 0,
        })
        if (error) console.error('food_log insert:', error)
      },

      removeClientEntry: async (clientId, date, entryId) => {
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return { ...c, log: { ...c.log, [date]: (c.log[date] || []).filter((e) => e.id !== entryId) } }
          }),
        }))
        await supabase.from('food_log').delete().eq('id', entryId)
      },

      updateClientEntry: async (clientId, date, entryId, updates) => {
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return {
              ...c,
              log: {
                ...c.log,
                [date]: (c.log[date] || []).map((e) =>
                  e.id === entryId ? { ...e, ...updates } : e
                ),
              },
            }
          }),
        }))
        await supabase.from('food_log').update({
          quantity: updates.quantity,
          calories: updates.calories,
          protein:  updates.protein,
          carbs:    updates.carbs,
          fat:      updates.fat,
        }).eq('id', entryId)
      },

      getClientTotalsForDate: (clientId, date) =>
        calcTotals(get().clients.find((c) => c.id === clientId)?.log?.[date]),

      // ── WEIGHT LOG ────────────────────────────────────────────────────────
      addClientWeight: async (clientId, entry) => {
        const id = crypto.randomUUID()
        const w  = { id, value: entry.value, unit: entry.unit || 'lbs', date: entry.date }

        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return { ...c, weightLog: [...c.weightLog, w].sort((a, b) => a.date.localeCompare(b.date)) }
          }),
        }))

        const { error } = await supabase.from('weight_log').insert({
          id, client_id: clientId, value: entry.value, unit: entry.unit || 'lbs', date: entry.date,
        })
        if (error) console.error('weight_log insert:', error)
      },

      removeClientWeight: async (clientId, weightId) => {
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return { ...c, weightLog: c.weightLog.filter((w) => w.id !== weightId) }
          }),
        }))
        await supabase.from('weight_log').delete().eq('id', weightId)
      },

      // ── WEEKLY CHECK-INS ──────────────────────────────────────────────────
      // Client submits a weekly check-in. Newest first. Attached photos also
      // land in the client's progress-photo timeline (their "file").
      addClientCheckin: async (clientId, data, photoFiles = []) => {
        // Upload photos first so their URLs ride on the check-in row
        const photoUrls = []
        for (const file of photoFiles) {
          const res = await get().addProgressPhoto(clientId, file, 'Weekly check-in')
          if (res?.photo?.url) photoUrls.push(res.photo.url)
        }

        const base = {
          client_id:   clientId,
          weight:      data.weight ?? null,
          weight_unit: data.weightUnit || 'lbs',
          adherence:   data.adherence ?? null,
          hunger:      data.hunger ?? null,
          energy:      data.energy ?? null,
          notes:       data.notes || '',
        }
        // answers/photos — retry progressively if newer migrations haven't run.
        let { data: row, error } = await supabase.from('checkins')
          .insert({ ...base, answers: data.answers || [], photo_urls: photoUrls }).select().single()
        if (error) {
          ({ data: row, error } = await supabase.from('checkins')
            .insert({ ...base, answers: data.answers || [] }).select().single())
        }
        if (error) {
          ({ data: row, error } = await supabase.from('checkins').insert(base).select().single())
        }
        if (error) { console.error('checkin insert:', error); return { ok: false } }

        const checkin = dbToCheckin(row)
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, checkins: [checkin, ...(c.checkins || [])] } : c
          ),
        }))

        // Check-in weight also feeds the weight log (skip if today already logged)
        if (data.weight) {
          const client = get().clients.find((c) => c.id === clientId)
          const todayStr = today()
          const alreadyLogged = (client?.weightLog || []).some((w) => w.date === todayStr)
          if (!alreadyLogged) {
            get().addClientWeight(clientId, { value: Number(data.weight), unit: data.weightUnit || 'lbs', date: todayStr })
          }
        }
        return { ok: true }
      },

      // Coach opened the check-in → clear its NEW badge (best-effort).
      markCheckinReviewed: async (clientId, checkinId) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, checkins: (c.checkins || []).map((k) => k.id === checkinId ? { ...k, reviewed: true } : k) }
              : c
          ),
        }))
        await supabase.from('checkins').update({ reviewed: true }).eq('id', checkinId)
      },

      // ── CHECK-IN QUESTIONS (coach-customizable form) ──────────────────────
      checkinQuestions: null,   // null = not fetched; [] = coach uses defaults

      // Coach → own set. Client → their coach's set. Empty/missing → defaults.
      fetchCheckinQuestions: async () => {
        const me = get().currentUser
        if (!me) return []
        let coachId = me.id
        if (me.role === 'client') {
          const client = get().clients.find((c) => c.id === get().activeClientId)
          coachId = client?.coachId
          if (!coachId) { set({ checkinQuestions: [] }); return [] }
        }
        const { data, error } = await supabase
          .from('checkin_questions')
          .select('*')
          .eq('coach_id', coachId)
          .order('sort_order', { ascending: true })
        if (error) { set({ checkinQuestions: [] }); return [] } // table missing → defaults
        const qs = (data || []).map(dbToQuestion)
        set({ checkinQuestions: qs })
        return qs
      },

      // Replace the coach's whole question set (simplest add/remove/edit model).
      saveCheckinQuestions: async (questions) => {
        const me = get().currentUser
        if (!me) return { ok: false, error: 'Not signed in.' }
        const { error: delErr } = await supabase
          .from('checkin_questions').delete().eq('coach_id', me.id)
        if (delErr) { console.error('questions delete:', delErr); return { ok: false, error: delErr.message } }

        const rows = questions.map((q, i) => ({
          coach_id:   me.id,
          label:      q.label,
          type:       q.type,
          low_label:  q.low  || '',
          high_label: q.high || '',
          slug:       q.slug || null,
          sort_order: i,
        }))
        if (rows.length) {
          const { data, error } = await supabase.from('checkin_questions').insert(rows).select()
          if (error) { console.error('questions insert:', error); return { ok: false, error: error.message } }
          set({ checkinQuestions: (data || []).map(dbToQuestion) })
        } else {
          set({ checkinQuestions: [] })
        }
        return { ok: true }
      },

      // ── COACH FORMS (intro questionnaire / custom / weekly settings) ──────
      coachForms: null,   // null = not fetched

      // Coach → all own forms. Client → their coach's ACTIVE forms.
      fetchCoachForms: async () => {
        const me = get().currentUser
        if (!me) return []
        let q = supabase.from('coach_forms').select('*').order('created_at', { ascending: true })
        if (me.role === 'client') {
          const client = get().clients.find((c) => c.id === get().activeClientId)
          if (!client?.coachId) { set({ coachForms: [] }); return [] }
          q = q.eq('coach_id', client.coachId).eq('active', true)
        } else {
          q = q.eq('coach_id', me.id)
        }
        const { data, error } = await q
        if (error) { set({ coachForms: [] }); return [] } // table missing → none
        const forms = (data || []).map(dbToForm)
        set({ coachForms: forms })
        return forms
      },

      // Create or update a form. `form.id` present → update, else insert.
      saveCoachForm: async (form) => {
        const me = get().currentUser
        if (!me) return { ok: false, error: 'Not signed in.' }
        const fields = {
          kind:         form.kind || 'custom',
          title:        form.title || '',
          description:  form.description || '',
          questions:    form.questions || [],
          allow_photos: form.allowPhotos ?? false,
          active:       form.active ?? true,
          updated_at:   new Date().toISOString(),
        }
        let res
        if (form.id) {
          res = await supabase.from('coach_forms').update(fields).eq('id', form.id).select().single()
        } else {
          res = await supabase.from('coach_forms').insert({ ...fields, coach_id: me.id }).select().single()
        }
        if (res.error) { console.error('saveCoachForm:', res.error); return { ok: false, error: res.error.message } }
        const saved = dbToForm(res.data)
        set((s) => {
          const list = s.coachForms || []
          const exists = list.some((f) => f.id === saved.id)
          return { coachForms: exists ? list.map((f) => (f.id === saved.id ? saved : f)) : [...list, saved] }
        })
        return { ok: true, form: saved }
      },

      deleteCoachForm: async (formId) => {
        set((s) => ({ coachForms: (s.coachForms || []).filter((f) => f.id !== formId) }))
        await supabase.from('coach_forms').delete().eq('id', formId)
      },

      // Client submits an intro/custom form (once per form).
      submitClientForm: async (form, clientId, answers) => {
        const { data: row, error } = await supabase.from('form_submissions').insert({
          form_id:    form.id,
          client_id:  clientId,
          form_kind:  form.kind,
          form_title: form.title,
          answers,
        }).select().single()
        if (error) { console.error('form submit:', error); return { ok: false } }
        const sub = dbToSubmission(row)
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, submissions: [sub, ...(c.submissions || [])] } : c
          ),
        }))
        return { ok: true }
      },

      // Coach viewed a submission → clear its NEW badge.
      markSubmissionReviewed: async (clientId, submissionId) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, submissions: (c.submissions || []).map((x) => x.id === submissionId ? { ...x, reviewed: true } : x) }
              : c
          ),
        }))
        await supabase.from('form_submissions').update({ reviewed: true }).eq('id', submissionId)
      },

      // ── MEAL PLANS ────────────────────────────────────────────────────────
      addMealPlan: async (clientId, plan) => {
        const { data: row, error } = await supabase
          .from('meal_plans')
          .insert({ client_id: clientId, plan_name: plan.planName || 'New Plan', days: plan.days || [] })
          .select().single()

        if (error) { console.error('addMealPlan:', error); return null }

        const newPlan = dbToPlan(row)

        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            const hasValidActive = (c.mealPlans || []).some((p) => p.id === c.activeMealPlanId)
            const activeMealPlanId = hasValidActive ? c.activeMealPlanId : newPlan.id
            // Sync active plan to DB if we just set it
            if (!hasValidActive) {
              supabase.from('clients').update({ active_meal_plan_id: newPlan.id }).eq('id', clientId)
            }
            return { ...c, mealPlans: [...(c.mealPlans || []), newPlan], activeMealPlanId }
          }),
        }))

        return newPlan.id
      },

      updateMealPlan: async (clientId, planId, updates) => {
        const dbUpdates = {}
        if (updates.planName !== undefined) dbUpdates.plan_name = updates.planName
        if (updates.days     !== undefined) dbUpdates.days      = updates.days

        await supabase.from('meal_plans').update(dbUpdates).eq('id', planId)
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return { ...c, mealPlans: (c.mealPlans || []).map((p) => p.id === planId ? { ...p, ...updates } : p) }
          }),
        }))
      },

      removeMealPlan: async (clientId, planId) => {
        await supabase.from('meal_plans').delete().eq('id', planId)
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return {
              ...c,
              mealPlans:        (c.mealPlans || []).filter((p) => p.id !== planId),
              activeMealPlanId: c.activeMealPlanId === planId ? null : c.activeMealPlanId,
            }
          }),
        }))
      },

      setActiveMealPlan: async (clientId, planId) => {
        await supabase.from('clients').update({ active_meal_plan_id: planId }).eq('id', clientId)
        set((s) => ({
          clients: s.clients.map((c) => c.id === clientId ? { ...c, activeMealPlanId: planId } : c),
        }))
      },

      // ── MESSAGES ──────────────────────────────────────────────────────────
      messages: {},
      coachRequests: [],

      // Hides the client BottomNav (e.g. when keyboard is open in chat thread)
      navHidden: false,
      setNavHidden: (v) => set({ navHidden: v }),

      // Ephemeral: when coach taps the chat icon on a client card, this is set
      // so the chat page auto-opens that client's thread on mount.
      pendingChatClientId: null,
      setPendingChatClientId: (id) => set({ pendingChatClientId: id }),

      // ── KAY AI CHAT ───────────────────────────────────────────────────────
      // Local-only; persisted to localStorage so history survives refresh.
      kayThreads: {},  // { [clientId]: [{ id, from:'user'|'kay', text, timestamp }] }
      kayTyping:  false,

      sendKayMessage: async (clientId, userText) => {
        const userMsg = {
          id:        crypto.randomUUID(),
          from:      'user',
          text:      userText,
          timestamp: new Date().toISOString(),
        }
        // Optimistic: add user message, start typing indicator
        set((s) => ({
          kayThreads: {
            ...s.kayThreads,
            [clientId]: [...(s.kayThreads[clientId] || []), userMsg],
          },
          kayTyping: true,
        }))

        try {
          const { kayThreads } = get()
          // Filter out empty/corrupt messages and error messages before sending
          const history = (kayThreads[clientId] || [])
            .filter((m) => m.text?.trim() && !m.isError)
            .map((m) => ({
              role:    m.from === 'user' ? 'user' : 'assistant',
              content: m.text,
            }))

          const res = await fetch('/api/ai/messages', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              max_tokens: 1024,
              system: `You are Kay — a Nutrition Expert with deep knowledge in sports dietetics, nutritional biochemistry, and evidence-based coaching. You give clients concise, evidence-based nutrition coaching through a mobile chat app.

Your voice: knowledgeable, warm, direct. Skip preambles — lead with the answer.

Rules:
- Stay in character as Kay at all times. Never break persona.
- Answer nutrition questions with specific, actionable guidance.
- If asked who you are: say "I'm Kay, your nutrition coach" and move on.
- Never open with "As an AI…", "As a language model…", or any AI disclaimer — you are Kay, a nutrition expert.
- Keep replies short — this is mobile chat, not a blog post.
- Work within the client's existing macro targets set by their coach.
- Do not diagnose medical conditions; refer to a doctor for medical issues.
- If asked something off-topic, briefly acknowledge and redirect to nutrition.
- Use **bold** to highlight 2–4 key terms or numbers per reply (e.g. **protein**, **30g**, **post-workout window**). Keep it selective — only the most important words.`,
              messages: history,
            }),
          })

          if (!res.ok) {
            let errBody = {}
            try { errBody = await res.json() } catch { /* non-JSON error */ }
            const detail = errBody.error?.message || errBody.error || `HTTP ${res.status}`
            throw new Error(detail)
          }

          const data  = await res.json()
          const reply = data.content?.[0]?.text || 'Sorry, I couldn\'t respond right now. Please try again.'

          const kayMsg = {
            id:        crypto.randomUUID(),
            from:      'kay',
            text:      reply,
            timestamp: new Date().toISOString(),
          }
          set((s) => ({
            kayThreads: {
              ...s.kayThreads,
              [clientId]: [...(s.kayThreads[clientId] || []), kayMsg],
            },
            kayTyping: false,
          }))
        } catch (e) {
          console.error('Kay AI error:', e)
          // Surface the actual error so it's diagnosable (API key missing, quota, etc.)
          const isKeyMissing = e.message?.toLowerCase().includes('api_key') ||
                               e.message?.toLowerCase().includes('api key') ||
                               e.message?.toLowerCase().includes('anthropic_api_key')
          const errText = isKeyMissing
            ? 'API key not configured on the server. Please contact your coach to set this up.'
            : (e.message || 'Having trouble connecting right now. Please try again.')
          const errMsg = {
            id:        crypto.randomUUID(),
            from:      'kay',
            text:      errText,
            timestamp: new Date().toISOString(),
            isError:   true,   // excluded from API history, styled differently in UI
          }
          set((s) => ({
            kayThreads: {
              ...s.kayThreads,
              [clientId]: [...(s.kayThreads[clientId] || []), errMsg],
            },
            kayTyping: false,
          }))
        }
      },

      sendMessage: async (clientId, from, text) => {
        const id  = crypto.randomUUID()
        const msg = {
          id, from, text,
          timestamp:     new Date().toISOString(),
          readByCoach:   from === 'coach',
          readByClient:  from === 'client',
        }
        // Optimistic
        set((s) => ({
          messages: { ...s.messages, [clientId]: [...(s.messages[clientId] || []), msg] },
        }))

        const { error } = await supabase.from('messages').insert({
          id, client_id: clientId, from_role: from, text,
          read_by_coach:  from === 'coach',
          read_by_client: from === 'client',
        })
        if (error) console.error('message insert:', error)

        // Fire-and-forget email notification
        try {
          const { currentUser, clients } = get()
          const client = clients.find((c) => c.id === clientId)

          if (from === 'coach' && client?.email) {
            // Coach messaged a client → notify the client
            fetch('/api/email/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type:           'message',
                recipientEmail: client.email,
                recipientName:  client.name,
                senderName:     currentUser?.name || 'Your Coach',
                senderRole:     'coach',
                preview:        text.slice(0, 120),
              }),
            }).catch(() => {}) // swallow errors — notification is best-effort
          } else if (from === 'client' && currentUser?.email) {
            // Client messaged the coach → notify the coach
            // (currentUser here is the client; coach email comes from their own session)
            // We notify coach at currentUser.email only if they are the coach account
            // This branch runs when a coach-role user is testing as client,
            // or when we can derive coach email from elsewhere.
            // No-op for now unless we have a dedicated coach profile lookup.
          }
        } catch (_) { /* notification errors should never break messaging */ }
      },

      signup: async (name, email, password, role) => {
        if (!supabase) return { ok: false, error: 'Supabase not configured' }
        const cleanEmail = email.trim()

        // Finalize once a session exists — shared by both signup paths.
        const finalize = async () => {
          const { data: profileRows } = await supabase.rpc('get_my_profile')
          const profile = profileRows?.[0] ?? null
          if (!profile) return { ok: false, error: 'Profile setup failed. Please try again.' }

          const currentUser = profileToUser(profile, cleanEmail)
          await get().loadAllData()

          const update = { isAuthenticated: true, currentUser }
          if (role === 'client') {
            const clientProfile = get().clients.find(
              (c) => c.email?.toLowerCase() === cleanEmail.toLowerCase()
            )
            if (clientProfile) {
              update.activeRole     = 'client'
              update.activeClientId = clientProfile.id
              update.activePage     = 'dashboard'
              if (clientProfile.coachId) {
                setTimeout(() => get().loadCoachProfile(clientProfile.coachId), 0)
              }
            }
          }
          set(update)
          return { ok: true }
        }

        // ── Preferred path: the `register` edge function creates an already-
        //    confirmed user via the admin API, sidestepping Supabase's built-in
        //    confirmation mailer (the source of "Error sending confirmation
        //    email"). Then we sign in directly. Falls back to the legacy
        //    signUp if the function isn't deployed / is unreachable.
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ email: cleanEmail, password, name: name.trim(), role }),
            }
          )
          const json = await res.json().catch(() => ({}))

          if (res.ok && json.ok) {
            const { error: signInErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail, password,
            })
            if (signInErr) return { ok: false, error: signInErr.message }
            return finalize()
          }
          // Real, actionable error (e.g. already registered) — surface it.
          if (res.status === 409 || json.already) {
            return { ok: false, error: json.error || 'An account with this email already exists.' }
          }
          // 404 / 500 / unexpected → fall through to the legacy path.
        } catch {
          // Network error / function not deployed → fall through.
        }

        // ── Fallback: original Supabase signUp (works once custom SMTP is set
        //    or email confirmation is disabled in the Supabase dashboard).
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name: name.trim(), role } },
        })
        if (error) return { ok: false, error: error.message }
        if (!data.session) return { ok: true, needsConfirmation: true }
        return finalize()
      },

      // Enter a coach code → link directly to that coach (no accept step).
      submitCoachCode: async (code) => {
        const { currentUser } = get()
        if (!currentUser) return { ok: false, error: 'Not logged in' }

        const { data, error } = await supabase
          .rpc('link_client_by_coach_code', { p_code: code.trim().toUpperCase() })

        if (error) {
          const msg = /invalid coach code/i.test(error.message)
            ? 'Invalid coach code. Double-check with your coach.'
            : error.message
          return { ok: false, error: msg }
        }

        const coachName = data?.[0]?.coach_name || ''

        // Reload client records so the new coach link + profile appear.
        await get().loadAllData()
        const me = get()
        const myClient = me.clients.find((c) => c.id === me.activeClientId)
        if (myClient?.coachId) get().loadCoachProfile(myClient.coachId)

        return { ok: true, coachName }
      },

      fetchCoachRequests: async () => {
        const { data, error } = await supabase
          .from('coach_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
        if (error) { console.error('fetchCoachRequests:', error); return }
        set({ coachRequests: data || [] })
      },

      respondToRequest: async (requestId, accept) => {
        const { coachRequests, currentUser } = get()
        const request = coachRequests.find((r) => r.id === requestId)
        if (!request) return { ok: false }

        if (accept) {
          // Tier cap — same limit the DB trigger enforces
          const limit = coachClientLimit(currentUser)
          if (limit !== null && get().clients.length >= limit) {
            return { ok: false, capReached: true, error: `Your plan allows up to ${limit} client${limit === 1 ? '' : 's'}. Upgrade your tier to accept this request.` }
          }
        }

        if (accept) {
          const { error: linkErr } = await supabase
            .from('clients')
            .update({ coach_id: currentUser.id })
            .eq('profile_id', request.client_profile_id)
          if (linkErr) { console.error('respondToRequest link:', linkErr); return { ok: false } }
        }

        const { error: statusErr } = await supabase.from('coach_requests').update({
          status: accept ? 'accepted' : 'rejected',
        }).eq('id', requestId)
        if (statusErr) console.error('respondToRequest status:', statusErr)

        set((s) => ({ coachRequests: s.coachRequests.filter((r) => r.id !== requestId) }))

        if (accept) await get().loadAllData()
        return { ok: true }
      },

      markMessagesRead: async (clientId, reader) => {
        set((s) => ({
          messages: {
            ...s.messages,
            [clientId]: (s.messages[clientId] || []).map((m) => ({
              ...m,
              readByCoach:  reader === 'coach'  ? true : m.readByCoach,
              readByClient: reader === 'client' ? true : m.readByClient,
            })),
          },
        }))
        const field = reader === 'coach' ? 'read_by_coach' : 'read_by_client'
        await supabase.from('messages')
          .update({ [field]: true })
          .eq('client_id', clientId)
          .eq(field, false)
      },

      // ── CUSTOM FOODS ──────────────────────────────────────────────────────
      customFoods: [],

      addCustomFood: async (food) => {
        const id = crypto.randomUUID()
        set((s) => ({ customFoods: [...s.customFoods, { ...food, id }] }))
        const { error } = await supabase.from('custom_foods').insert({
          id, name: food.name, brand: food.brand || '',
          serving_size: food.servingSize || null, serving_unit: food.servingUnit || null,
          calories: food.calories ?? 0, protein: food.protein ?? 0,
          carbs: food.carbs ?? 0, fat: food.fat ?? 0,
          upc: food.upc || null, source: 'custom',
        })
        if (error) console.error('custom_food insert:', error)
      },

      removeCustomFood: async (id) => {
        set((s) => ({ customFoods: s.customFoods.filter((f) => f.id !== id) }))
        await supabase.from('custom_foods').delete().eq('id', id)
      },

      updateCustomFood: async (id, updates) => {
        set((s) => ({ customFoods: s.customFoods.map((f) => f.id === id ? { ...f, ...updates } : f) }))
        const dbUpd = {}
        if (updates.name        !== undefined) dbUpd.name         = updates.name
        if (updates.brand       !== undefined) dbUpd.brand        = updates.brand
        if (updates.servingSize !== undefined) dbUpd.serving_size = updates.servingSize
        if (updates.servingUnit !== undefined) dbUpd.serving_unit = updates.servingUnit
        if (updates.calories    !== undefined) dbUpd.calories     = updates.calories
        if (updates.protein     !== undefined) dbUpd.protein      = updates.protein
        if (updates.carbs       !== undefined) dbUpd.carbs        = updates.carbs
        if (updates.fat         !== undefined) dbUpd.fat          = updates.fat
        await supabase.from('custom_foods').update(dbUpd).eq('id', id)
      },

      // ── SCANNED FOODS (synchronous return value required by ScannedFoodModal) ──
      scannedFoods: [],
      overrideFoods: [],
      hiddenFoodIds: [],   // built-in food ids hidden from the shared DB (superadmin)

      addScannedFood: (food) => {
        const { scannedFoods } = get()

        // Dedup by UPC
        if (food.upc) {
          const dup = scannedFoods.find((f) => f.upc === food.upc)
          if (dup) return { ok: false, reason: 'duplicate_upc', existing: dup }
        }
        // Dedup by name + brand
        const nl = food.name.toLowerCase().trim()
        const bl = (food.brand || '').toLowerCase().trim()
        const dupName = scannedFoods.find(
          (f) => f.name.toLowerCase().trim() === nl && (f.brand || '').toLowerCase().trim() === bl
        )
        if (dupName) return { ok: false, reason: 'duplicate_name', existing: dupName }

        const id      = crypto.randomUUID()
        const newFood = { ...food, id }
        set((s) => ({ scannedFoods: [...s.scannedFoods, newFood] }))

        // Fire-and-forget write (caller can't await — it uses the sync return value)
        supabase.from('custom_foods').insert({
          id, name: food.name, brand: food.brand || '',
          serving_size: food.servingSize || null, serving_unit: food.servingUnit || null,
          calories: food.calories ?? 0, protein: food.protein ?? 0,
          carbs: food.carbs ?? 0, fat: food.fat ?? 0,
          upc: food.upc || null, source: 'scanned',
        }).then(({ error }) => { if (error) console.error('scanned_food insert:', error) })

        return { ok: true, food: newFood }
      },

      removeScannedFood: async (id) => {
        set((s) => ({ scannedFoods: s.scannedFoods.filter((f) => f.id !== id) }))
        await supabase.from('custom_foods').delete().eq('id', id)
      },

      updateScannedFood: async (id, updates) => {
        set((s) => ({ scannedFoods: s.scannedFoods.map((f) => f.id === id ? { ...f, ...updates } : f) }))
        const dbUpd = {}
        if (updates.name        !== undefined) dbUpd.name         = updates.name
        if (updates.brand       !== undefined) dbUpd.brand        = updates.brand
        if (updates.servingSize !== undefined) dbUpd.serving_size = updates.servingSize
        if (updates.servingUnit !== undefined) dbUpd.serving_unit = updates.servingUnit
        if (updates.calories    !== undefined) dbUpd.calories     = updates.calories
        if (updates.protein     !== undefined) dbUpd.protein      = updates.protein
        if (updates.carbs       !== undefined) dbUpd.carbs        = updates.carbs
        if (updates.fat         !== undefined) dbUpd.fat          = updates.fat
        await supabase.from('custom_foods').update(dbUpd).eq('id', id)
      },

      upsertFoodOverride: async (originalId, foodData) => {
        const existing = get().overrideFoods.find((f) => f.id === originalId)
        const food = { ...foodData, id: originalId }
        if (existing) {
          set((s) => ({ overrideFoods: s.overrideFoods.map((f) => f.id === originalId ? food : f) }))
          await supabase.from('custom_foods').update({
            name: food.name, brand: food.brand || '',
            serving_size: food.servingSize, serving_unit: food.servingUnit || null,
            calories: food.calories ?? 0, protein: food.protein ?? 0,
            carbs: food.carbs ?? 0, fat: food.fat ?? 0,
            fiber: food.fiber ?? 0, sugar: food.sugar ?? 0, sodium: food.sodium ?? 0,
          }).eq('id', originalId)
        } else {
          set((s) => ({ overrideFoods: [...s.overrideFoods, food] }))
          await supabase.from('custom_foods').insert({
            id: originalId, source: 'override',
            name: food.name, brand: food.brand || '',
            serving_size: food.servingSize, serving_unit: food.servingUnit || null,
            calories: food.calories ?? 0, protein: food.protein ?? 0,
            carbs: food.carbs ?? 0, fat: food.fat ?? 0,
            fiber: food.fiber ?? 0, sugar: food.sugar ?? 0, sodium: food.sodium ?? 0,
          })
        }
      },

      removeFoodOverride: async (id) => {
        set((s) => ({ overrideFoods: s.overrideFoods.filter((f) => f.id !== id) }))
        await supabase.from('custom_foods').delete().eq('id', id)
      },

      // Superadmin: hide a built-in food from the shared database. Stored as a
      // 'deleted' marker row keyed by the built-in id; loadAllData reads these
      // into hiddenFoodIds and every food list filters them out globally.
      // Mirrors the override pattern (insert when new, flip the row when it was
      // already overridden) so it persists wherever overrides persist.
      deleteBuiltinFood: async (food) => {
        const id = food.id
        const wasOverride = get().overrideFoods.some((f) => f.id === id)
        set((s) => ({
          hiddenFoodIds: s.hiddenFoodIds.includes(id) ? s.hiddenFoodIds : [...s.hiddenFoodIds, id],
          overrideFoods: s.overrideFoods.filter((f) => f.id !== id),
        }))
        const { error } = wasOverride
          ? await supabase.from('custom_foods').update({ source: 'deleted' }).eq('id', id)
          : await supabase.from('custom_foods').insert({
              id, source: 'deleted',
              name: food.name || 'deleted', brand: food.brand || '',
              serving_size: food.servingSize ?? null, serving_unit: food.servingUnit ?? null,
              calories: 0, protein: 0, carbs: 0, fat: 0,
            })
        if (error) console.error('deleteBuiltinFood:', error)
      },

      // Superadmin: bring a deleted built-in food back into the database.
      restoreBuiltinFood: async (id) => {
        set((s) => ({ hiddenFoodIds: s.hiddenFoodIds.filter((x) => x !== id) }))
        const { error } = await supabase.from('custom_foods').delete().eq('id', id)
        if (error) console.error('restoreBuiltinFood:', error)
      },

      // Add an AI-sourced food to the shared database (superadmin only)
      addAIFood: async (food) => {
        const id = crypto.randomUUID()
        const newFood = { ...food, id, source: 'ai' }
        // AI foods end up in scannedFoods (loadAllData puts source!='custom'&&!='override' there)
        set((s) => ({ scannedFoods: [...s.scannedFoods, { ...newFood }] }))
        const { error } = await supabase.from('custom_foods').insert({
          id,
          name:         food.name,
          brand:        food.brand        || '',
          serving_size: food.servingSize  || null,
          serving_unit: food.servingUnit  || null,
          calories:     food.calories     ?? 0,
          protein:      food.protein      ?? 0,
          carbs:        food.carbs        ?? 0,
          fat:          food.fat          ?? 0,
          source:       'ai',
        })
        if (error) {
          console.error('addAIFood insert:', error)
          set((s) => ({ scannedFoods: s.scannedFoods.filter((f) => f.id !== id) }))
          return { ok: false, error: error.message }
        }
        return { ok: true, food: newFood }
      },

      // ── COACH PROFILE ─────────────────────────────────────────────────────
      coachProfile: null,  // { id, name, bio, specialties, credentials, website }

      // Called on client login — loads their coach's public profile
      loadCoachProfile: async (coachId) => {
        if (!supabase || !coachId) return
        const { data, error } = await supabase.rpc('get_coach_profile', { p_coach_id: coachId })
        if (!error && data?.[0]) {
          set({ coachProfile: data[0] })
        }
      },

      // Called when a coach saves changes to their profile
      updateCoachProfile: async (updates) => {
        const { currentUser } = get()
        if (!currentUser?.id) return { ok: false }
        const dbUpdates = {}
        if (updates.bio         !== undefined) dbUpdates.bio         = updates.bio
        if (updates.specialties !== undefined) dbUpdates.specialties = updates.specialties
        if (updates.credentials !== undefined) dbUpdates.credentials = updates.credentials
        if (updates.website     !== undefined) dbUpdates.website     = updates.website
        if (updates.name        !== undefined) dbUpdates.name        = updates.name
        const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', currentUser.id)
        if (error) { console.error('updateCoachProfile:', error); return { ok: false, error: error.message } }
        set((s) => ({
          currentUser: s.currentUser ? { ...s.currentUser, ...updates } : s.currentUser,
        }))
        return { ok: true }
      },

      // ── CLIENT SELECTOR ───────────────────────────────────────────────────
      activeClientId: null,
      setActiveClientId: (id) => set({ activeClientId: id, activePage: 'dashboard' }),
    }),
    {
      // Storage key bumped to -dark2: abandons stale pre-default-change theme
      // preferences (which were stuck on ocean-light) so everyone falls back to
      // the ocean-dark default. Future theme choices persist under this key.
      name: 'macrostack-ui-dark2',
      version: 2,
      // Only persist UI preferences — all data comes from Supabase
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)

export default useStore
