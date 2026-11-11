import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Contribution, Goal, Profile, Reto, Tanda } from './types'
import { iso, today, uid } from './lib/format'
import { isMoney, progress } from './lib/calc'

interface State {
  profile: Profile
  goals: Goal[]
  mainId?: string
  saved: string[] // ideas guardadas del catálogo
  tandas: Tanda[]
  retos: Reto[]
  addTanda: (t: Tanda) => void
  updateTanda: (id: string, fn: (t: Tanda) => void) => void
  removeTanda: (id: string) => void
  addReto: (r: Reto) => void
  updateReto: (id: string, fn: (r: Reto) => void) => void
  removeReto: (id: string) => void
  /** Registra un aporte en una meta y devuelve su id (para retos que deben poder deshacerlo). */
  addContributionId: (goalId: string, c: Omit<Contribution, 'id'>) => string
  setProfile: (p: Partial<Profile>) => void
  addGoal: (g: Goal) => void
  updateGoal: (id: string, fn: (g: Goal) => void) => void
  removeGoal: (id: string) => void
  setMain: (id: string) => void
  addContribution: (goalId: string, c: Omit<Contribution, 'id'>) => { completed: boolean }
  editContribution: (goalId: string, c: Contribution) => void
  removeContribution: (goalId: string, cid: string) => void
  toggleSaved: (itemId: string) => void
  reset: () => void
}

const fresh = (): Pick<State, 'profile' | 'goals' | 'mainId' | 'saved' | 'tandas' | 'retos'> => ({
  profile: { name: '', pay: 'quincenal', interests: [], onboarded: false, theme: 'dark', notify: false },
  goals: [],
  mainId: undefined,
  saved: [],
  tandas: [],
  retos: [],
})

const markDone = (g: Goal) => {
  if (!g.completedAt && progress(g) >= 1) { g.completedAt = iso(today()); return true }
  if (g.completedAt && progress(g) < 1) g.completedAt = undefined
  return false
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...fresh(),
      setProfile: p => set(s => ({ profile: { ...s.profile, ...p } })),
      addGoal: g => set(s => ({ goals: [g, ...s.goals], mainId: s.mainId ?? g.id })),
      updateGoal: (id, fn) => set(s => ({ goals: s.goals.map(g => { if (g.id !== id) return g; const c = structuredClone(g); fn(c); markDone(c); return c }) })),
      removeGoal: id => set(s => {
        const goals = s.goals.filter(g => g.id !== id)
        return { goals, mainId: s.mainId === id ? goals[0]?.id : s.mainId }
      }),
      setMain: id => set({ mainId: id }),
      addContribution: (goalId, c) => {
        let completed = false
        set(s => ({
          goals: s.goals.map(g => {
            if (g.id !== goalId) return g
            const n = structuredClone(g)
            n.contributions = [{ ...c, id: uid() }, ...n.contributions]
            completed = markDone(n) && isMoney(n)
            return n
          }),
        }))
        return { completed }
      },
      editContribution: (goalId, c) => get().updateGoal(goalId, g => { g.contributions = g.contributions.map(x => (x.id === c.id ? c : x)) }),
      removeContribution: (goalId, cid) => get().updateGoal(goalId, g => { g.contributions = g.contributions.filter(x => x.id !== cid) }),
      addContributionId: (goalId, c) => {
        const id = uid()
        get().updateGoal(goalId, g => { g.contributions = [{ ...c, id }, ...g.contributions] })
        return id
      },
      addTanda: t => set(s => ({ tandas: [t, ...s.tandas] })),
      updateTanda: (id, fn) => set(s => ({ tandas: s.tandas.map(t => { if (t.id !== id) return t; const c = structuredClone(t); fn(c); return c }) })),
      removeTanda: id => set(s => ({ tandas: s.tandas.filter(t => t.id !== id) })),
      addReto: r => set(s => ({ retos: [r, ...s.retos] })),
      updateReto: (id, fn) => set(s => ({ retos: s.retos.map(r => { if (r.id !== id) return r; const c = structuredClone(r); fn(c); return c }) })),
      removeReto: id => set(s => ({ retos: s.retos.filter(r => r.id !== id) })),
      toggleSaved: itemId => set(s => ({ saved: s.saved.includes(itemId) ? s.saved.filter(x => x !== itemId) : [...s.saved, itemId] })),
      reset: () => set(fresh()),
    }),
    { name: 'ugoal-v3', version: 1 },
  ),
)
