import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { Goal } from '../types'
import { distribute, isMoney, remaining } from '../lib/calc'
import { iso, money, today, typed } from '../lib/format'
import { AFTER_SAVE, pick } from '../lib/phrases'
import { Photo, Sheet, burst, toast } from './ui'

const n = (s: string) => parseFloat(s.replace(/,/g, '')) || 0

/** Aparté para todas: reparte lo que apartaste según lo que le toca a cada meta; lo que sobra va a la principal. */
export function SplitSheet({ open, onClose, onCompleted }: { open: boolean; onClose: () => void; onCompleted: (g: Goal) => void }) {
  const { goals, profile, mainId, addContribution } = useStore()
  const [amt, setAmt] = useState('')
  useEffect(() => { if (open) setAmt('') }, [open])
  const plan = distribute(goals, n(amt), profile.pay, mainId)
  const save = () => {
    if (!plan.length) { toast('Escribe cuánto apartaste'); return }
    let done: Goal | null = null
    for (const p of plan) {
      const { completed } = addContribution(p.g.id, { amount: p.amount, note: 'Repartido', date: iso(today()) })
      if (completed) done = useStore.getState().goals.find(x => x.id === p.g.id) ?? null
    }
    onClose()
    if (done) onCompleted(done); else { burst(50); toast(pick(AFTER_SAVE)) }
  }
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="t-lg">Repartir entre mis metas</h2>
      <p className="t-sm">Escribe todo lo que apartaste. Cada meta recibe lo que le toca para ir al día y lo que sobre va a tu meta principal.</p>
      <label className="money-input"><span>$</span><input inputMode="decimal" placeholder="0" autoFocus value={amt} onChange={e => setAmt(typed(e.target.value))} aria-label="Monto total" /></label>
      {plan.length > 0 && (
        <div className="list">
          {plan.map(p => (
            <motion.div layout key={p.g.id} className="li">
              <div style={{ width: 44, flex: 'none' }}><Photo src={p.g.photo} mode={p.g.photoMode} ratio="1/1" shade={false} /></div>
              <span className="col" style={{ flex: 1, gap: 0, minWidth: 0 }}><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.g.title}</b><span className="t-sm">le faltan {money(remaining(p.g))}</span></span>
              <b className="lime">+{money(p.amount)}</b>
            </motion.div>
          ))}
        </div>
      )}
      <button className="btn" onClick={save}>Repartir</button>
    </Sheet>
  )
}

/** "No me lo compré": convierte un antojo que evitaste en dinero para tu meta. */
const SKIPS: [string, number][] = [['Café', 65], ['Tacos', 120], ['Uber', 90], ['Antojo', 50], ['Chelas', 150], ['Comida fuera', 250], ['Cine', 180], ['Delivery', 200], ['Ropa', 500]]
export function QuickSheet({ open, onClose, onCompleted }: { open: boolean; onClose: () => void; onCompleted: (g: Goal) => void }) {
  const { goals, mainId, addContribution } = useStore()
  const money$ = goals.filter(g => isMoney(g) && !g.completedAt)
  const [goalId, setGoalId] = useState('')
  const [custom, setCustom] = useState('')
  useEffect(() => { if (open) { setGoalId(money$.find(g => g.id === mainId)?.id ?? money$[0]?.id ?? ''); setCustom('') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const add = (what: string, amount: number) => {
    if (!goalId || !(amount > 0)) return
    const { completed } = addContribution(goalId, { amount, note: `No me compré: ${what}`, date: iso(today()) })
    onClose()
    if (completed) onCompleted(useStore.getState().goals.find(x => x.id === goalId)!)
    else { burst(30); toast(`+${money(amount)}. Tu yo del futuro te lo agradece.`) }
  }
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="t-lg">No me lo compré</h2>
      <p className="t-sm">Ese antojo que evitaste ahora es dinero para tu meta. Aparta ese monto de verdad.</p>
      {money$.length > 1 && (
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {money$.map(g => <button key={g.id} className={`chip ${goalId === g.id ? 'lime' : ''}`} style={{ height: 36, flex: 'none' }} onClick={() => setGoalId(g.id)}>{g.title}</button>)}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {SKIPS.map(([w, a]) => (
          <motion.button key={w} whileTap={{ scale: 0.94 }} className="card" style={{ padding: '12px 8px', gap: 2, alignItems: 'center' }} onClick={() => add(w, a)}>
            <b style={{ fontSize: 14 }}>{w}</b><span className="t-sm lime" style={{ fontWeight: 700 }}>{money(a)}</span>
          </motion.button>
        ))}
      </div>
      <form style={{ display: 'flex', gap: 8 }} onSubmit={e => { e.preventDefault(); add('Otro', n(custom)) }}>
        <input className="input" style={{ height: 50 }} inputMode="decimal" placeholder="Otro monto $" value={custom} onChange={e => setCustom(typed(e.target.value))} aria-label="Otro monto" />
        <button className="btn sm" style={{ height: 50 }}>Sumar</button>
      </form>
    </Sheet>
  )
}
