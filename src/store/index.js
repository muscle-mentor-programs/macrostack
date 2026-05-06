import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

const today = () => format(new Date(), 'yyyy-MM-dd')

// ─── Hardcoded user accounts ──────────────────────────────────────────────────
const USERS = [
  {
    id: 'superadmin',
    name: 'Branden Hales',
    email: 'brandenmhales@gmail.com',
    password: 'Mannabran1!',
    role: 'superadmin',
  },
  {
    id: 'client_grayson',
    name: 'Grayson Hales',
    email: 'graysonhales0@gmail.com',
    password: 'Mannabran1!',
    role: 'client',
  },
]

const calcTotals = (entries = []) =>
  entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

const useStore = create(
  persist(
    (set, get) => ({
      // ─────────────────────────────────────────────────────────────
      // AUTH
      // ─────────────────────────────────────────────────────────────
      isAuthenticated: false,
      currentUser: null,

      // edition: 'coach' | 'client' — validates role matches the login form used
      login: (email, password, edition = null) => {
        const match = USERS.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase().trim() &&
            u.password === password
        )
        if (!match) return { ok: false, error: 'Invalid email or password.' }

        // Reject if wrong edition
        if (edition === 'coach' && match.role === 'client')
          return { ok: false, error: 'This account requires the Client Edition.' }
        if (edition === 'client' && match.role !== 'client')
          return { ok: false, error: 'This account requires the Coach Edition.' }

        const { password: _pw, ...safeUser } = match
        const update = { isAuthenticated: true, currentUser: safeUser }

        // Client users skip the role selector — route them straight in
        if (safeUser.role === 'client') {
          update.activeRole = 'client'
          update.activePage = 'dashboard'
          const profile = get().clients.find(
            (c) => c.email?.toLowerCase() === safeUser.email.toLowerCase()
          )
          if (profile) update.activeClientId = profile.id
        }

        set(update)
        return { ok: true }
      },

      logout: () =>
        set({
          isAuthenticated: false,
          currentUser: null,
          activeRole: null,
          activeClientId: null,
        }),

      // ─────────────────────────────────────────────────────────────
      // THEME
      // ─────────────────────────────────────────────────────────────
      theme: 'dark', // 'dark' | 'light'
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('light', next === 'light')
      },

      // ─────────────────────────────────────────────────────────────
      // ROLE
      // ─────────────────────────────────────────────────────────────
      activeRole: null, // null | 'coach' | 'client'
      setActiveRole: (role) => set({ activeRole: role }),

      // ─────────────────────────────────────────────────────────────
      // NAVIGATION
      // ─────────────────────────────────────────────────────────────
      activePage: 'clients',
      setActivePage: (page) => set({ activePage: page }),

      logDate: today(),
      setLogDate: (date) => set({ logDate: date }),

      // ─────────────────────────────────────────────────────────────
      // COACH'S OWN DATA
      // ─────────────────────────────────────────────────────────────
      goals: { calories: 2400, protein: 180, carbs: 240, fat: 80 },
      setGoals: (goals) => set({ goals }),

      log: {},
      addEntry: (entry) => {
        const date = entry.date || today()
        const id = Date.now().toString()
        set((s) => ({
          log: {
            ...s.log,
            [date]: [...(s.log[date] || []), { ...entry, id, date }],
          },
        }))
      },
      removeEntry: (date, id) =>
        set((s) => ({
          log: {
            ...s.log,
            [date]: (s.log[date] || []).filter((e) => e.id !== id),
          },
        })),
      updateEntry: (date, id, updates) =>
        set((s) => ({
          log: {
            ...s.log,
            [date]: (s.log[date] || []).map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
          },
        })),

      weightLog: [],
      addWeight: (entry) => {
        const id = Date.now().toString()
        set((s) => ({
          weightLog: [...s.weightLog, { ...entry, id }].sort((a, b) =>
            a.date.localeCompare(b.date)
          ),
        }))
      },
      removeWeight: (id) =>
        set((s) => ({ weightLog: s.weightLog.filter((w) => w.id !== id) })),

      customFoods: [],
      addCustomFood: (food) => {
        const id = 'custom_' + Date.now().toString()
        set((s) => ({ customFoods: [...s.customFoods, { ...food, id }] }))
      },
      removeCustomFood: (id) =>
        set((s) => ({ customFoods: s.customFoods.filter((f) => f.id !== id) })),

      updateCustomFood: (id, updates) =>
        set((s) => ({
          customFoods: s.customFoods.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      // ─── SCANNED FOODS (shared across all users) ──────────────────
      scannedFoods: [],

      addScannedFood: (food) => {
        const { scannedFoods } = get()

        // Deduplicate by UPC (exact match)
        if (food.upc) {
          const dupUPC = scannedFoods.find((f) => f.upc === food.upc)
          if (dupUPC) return { ok: false, reason: 'duplicate_upc', existing: dupUPC }
        }

        // Deduplicate by name + brand (case-insensitive)
        const nameLower  = food.name.toLowerCase().trim()
        const brandLower = (food.brand || '').toLowerCase().trim()
        const dupName = scannedFoods.find(
          (f) =>
            f.name.toLowerCase().trim()          === nameLower &&
            (f.brand || '').toLowerCase().trim() === brandLower
        )
        if (dupName) return { ok: false, reason: 'duplicate_name', existing: dupName }

        const id      = 'scanned_' + Date.now().toString()
        const newFood = { ...food, id }
        set((s) => ({ scannedFoods: [...s.scannedFoods, newFood] }))
        return { ok: true, food: newFood }
      },

      removeScannedFood: (id) =>
        set((s) => ({ scannedFoods: s.scannedFoods.filter((f) => f.id !== id) })),

      getTotalsForDate: (date) => calcTotals(get().log[date]),

      // ─────────────────────────────────────────────────────────────
      // CLIENT MANAGEMENT (coach side)
      // ─────────────────────────────────────────────────────────────
      clients: [],
      viewingClientId: null,
      viewingClientTab: null,
      setViewingClientId: (id, tab = null) => set({ viewingClientId: id, viewingClientTab: tab }),

      addClient: (data) => {
        const id = 'client_' + Date.now().toString()
        const client = {
          id,
          name: data.name || 'New Client',
          email: data.email || '',
          goals: data.goals || { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          log: {},
          weightLog: [],
          mealPlans: [],
          activeMealPlanId: null,
          createdAt: today(),
          // Client-editable profile fields
          height: '',
          dob:    '',
          phone:  '',
          bio:    '',
        }
        set((s) => ({ clients: [...s.clients, client] }))
        return id
      },

      removeClient: (id) =>
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          viewingClientId: s.viewingClientId === id ? null : s.viewingClientId,
          activeClientId: s.activeClientId === id ? null : s.activeClientId,
        })),

      updateClientInfo: (clientId, info) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, ...info } : c
          ),
        })),

      // Client-editable personal fields (name, height, dob, phone, bio)
      updateClientProfile: (clientId, { name, height, dob, phone, bio }) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  ...(name   !== undefined && { name }),
                  ...(height !== undefined && { height }),
                  ...(dob    !== undefined && { dob }),
                  ...(phone  !== undefined && { phone }),
                  ...(bio    !== undefined && { bio }),
                }
              : c
          ),
        })),

      updateClientGoals: (clientId, goals) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, goals } : c
          ),
        })),

      addClientEntry: (clientId, entry) => {
        const date = entry.date || today()
        const id = Date.now().toString()
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return {
              ...c,
              log: {
                ...c.log,
                [date]: [...(c.log[date] || []), { ...entry, id, date }],
              },
            }
          }),
        }))
      },

      removeClientEntry: (clientId, date, entryId) =>
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return {
              ...c,
              log: {
                ...c.log,
                [date]: (c.log[date] || []).filter((e) => e.id !== entryId),
              },
            }
          }),
        })),

      addClientWeight: (clientId, entry) => {
        const id = Date.now().toString()
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return {
              ...c,
              weightLog: [...c.weightLog, { ...entry, id }].sort((a, b) =>
                a.date.localeCompare(b.date)
              ),
            }
          }),
        }))
      },

      removeClientWeight: (clientId, weightId) =>
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return { ...c, weightLog: c.weightLog.filter((w) => w.id !== weightId) }
          }),
        })),

      // ─── MEAL PLANS ───────────────────────────────────────────
      addMealPlan: (clientId, plan) => {
        const id = 'plan_' + Date.now().toString()
        const newPlan = { ...plan, id, createdAt: today() }
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            const existingPlans = c.mealPlans || []
            // Activate the new plan if there is no current active plan OR
            // the current activeMealPlanId points to a plan that no longer exists
            const hasValidActive = existingPlans.some((p) => p.id === c.activeMealPlanId)
            return {
              ...c,
              mealPlans: [...existingPlans, newPlan],
              activeMealPlanId: hasValidActive ? c.activeMealPlanId : id,
            }
          }),
        }))
        return id
      },

      updateMealPlan: (clientId, planId, updates) =>
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return {
              ...c,
              mealPlans: (c.mealPlans || []).map((p) =>
                p.id === planId ? { ...p, ...updates } : p
              ),
            }
          }),
        })),

      removeMealPlan: (clientId, planId) =>
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c
            return {
              ...c,
              mealPlans: (c.mealPlans || []).filter((p) => p.id !== planId),
              activeMealPlanId:
                c.activeMealPlanId === planId ? null : c.activeMealPlanId,
            }
          }),
        })),

      setActiveMealPlan: (clientId, planId) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, activeMealPlanId: planId } : c
          ),
        })),

      getClientTotalsForDate: (clientId, date) => {
        const client = get().clients.find((c) => c.id === clientId)
        return calcTotals(client?.log?.[date])
      },

      // ─────────────────────────────────────────────────────────────
      // MESSAGES  { [clientId]: [{id, from, text, timestamp, readByCoach, readByClient}] }
      // ─────────────────────────────────────────────────────────────
      messages: {},

      sendMessage: (clientId, from, text) =>
        set((s) => ({
          messages: {
            ...s.messages,
            [clientId]: [
              ...(s.messages[clientId] || []),
              {
                id:            Date.now().toString(),
                from,
                text,
                timestamp:     new Date().toISOString(),
                readByCoach:   from === 'coach',
                readByClient:  from === 'client',
              },
            ],
          },
        })),

      markMessagesRead: (clientId, reader) =>
        set((s) => ({
          messages: {
            ...s.messages,
            [clientId]: (s.messages[clientId] || []).map((m) => ({
              ...m,
              readByCoach:  reader === 'coach'  ? true : m.readByCoach,
              readByClient: reader === 'client' ? true : m.readByClient,
            })),
          },
        })),

      // ─────────────────────────────────────────────────────────────
      // CLIENT SIDE (active client profile for client mode)
      // ─────────────────────────────────────────────────────────────
      activeClientId: null,
      setActiveClientId: (id) =>
        set({ activeClientId: id, activePage: 'dashboard' }),
    }),
    { name: 'macrostack-v2' }
  )
)

export default useStore
