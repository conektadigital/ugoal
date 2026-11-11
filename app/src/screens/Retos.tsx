import { motion } from 'framer-motion'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { back, go } from '../router'
import type { Reto, RetoKind } from '../types'
import { isMoney } from '../lib/calc'
import { DAY, fShort, iso, money, parse, today, uid } from '../lib/format'
import { Bar, Sheet, burst, toast } from '../components/ui'
import { Chips } from './NewGoal'

export const RETOS: Record<RetoKind, { name: string; steps: number; unit: string; desc: string; bases: number[]; amount: (i: number, b: number) => number; free?: boolean }> = {
  '52semanas': { name: 'Reto 52 semanas', steps: 52, unit: 'Semana', desc: 'Cada semana apartas un poco más: semana 1 = 1×, semana 52 = 52×.', bases: [10, 20, 50], amount: (i, b) => (i + 1) * b },
  '30dias': { name: '30 días de ahorro', steps: 30, unit: 'Día', desc: 'La misma cantidad todos los días durante un mes.', bases: [30, 50, 100], amount: (_i, b) => b },
  sobres: { name: 'Reto de los 100 sobres', steps: 100, unit: 'Sobre', desc: '100 sobres numerados. Cada día eliges uno y apartas su número. Al final suman 5,050 veces la base.', bases: [1, 5, 10], amount: (i, b) => (i + 1) * b, free: true },
  antojos: { name: 'Fines sin antojos', steps: 8, unit: 'Fin', desc: 'Ocho fines de semana sin comprar antojos ni delivery. Lo que no gastas lo apartas.', bases: [200, 300, 500], amount: (_i, b) => b },
  diario: { name: 'Ahorro diario', steps: 100, unit: 'Día', desc: 'La misma cantidad todos los días. Tú eliges cuánto y por cuántos días.', bases: [10, 20, 50, 100], amount: (_i, b) => b },
  sube: { name: 'Reto que sube', steps: 100, unit: 'Día', desc: 'Cada día apartas un poco más: día 1 = 1×, día 2 = 2×… Al final juntas mucho más.', bases: [1, 5, 10], amount: (i, b) => (i + 1) * b },
  semanal: { name: 'Ahorro semanal', steps: 20, unit: 'Semana', desc: 'La misma cantidad cada semana, por las semanas que elijas.', bases: [100, 200, 500, 1000], amount: (_i, b) => b },
  monto: { name: 'Reto con monto', steps: 20, unit: 'Semana', desc: 'Eliges cuánto quieres juntar y en cuántas semanas. La app arma tu calendario.', bases: [5000, 10000, 20000], amount: (_i, b) => b / 20 },
}
/** Definición de un reto ya creado (el reto con monto depende de sus semanas). */
const FREE: RetoKind[] = ['diario', 'sube', 'semanal']
export const DAILY_KINDS: RetoKind[] = ['30dias', 'sobres', 'diario', 'sube']
export function def(r: Pick<Reto, 'kind' | 'base' | 'weeks'>) {
  const d = RETOS[r.kind]
  if (FREE.includes(r.kind)) return { ...d, steps: r.weeks ?? d.steps }
  if (r.kind !== 'monto') return d
  const w = r.weeks ?? 20, per = Math.floor(r.base / w)
  return { ...d, steps: w, amount: (i: number) => (i === w - 1 ? r.base - per * (w - 1) : per) }
}
export const retoTotal = (r: Pick<Reto, 'kind' | 'base' | 'weeks'>) => { const d = def(r); return Array.from({ length: d.steps }, (_, i) => d.amount(i, r.base)).reduce((a, b) => a + b, 0) }
const retoSaved = (r: Reto) => { const d = def(r); return Object.keys(r.marks).reduce((s, k) => s + d.amount(+k, r.base), 0) }

export default function Retos({ id }: { id?: string }) {
  if (id) return <RetoDetail id={id} />
  return <RetoList />
}

function RetoList() {
  const { retos, goals, addReto } = useStore()
  const [pick, setPick] = useState<RetoKind | null>(null)
  const [base, setBase] = useState(0)
  const [goalId, setGoalId] = useState('')
  const [weeks, setWeeks] = useState(20)
  const moneyGoals = goals.filter(g => isMoney(g) && !g.completedAt)
  const start = () => {
    if (!pick) return
    const r: Reto = { id: uid(), kind: pick, base, start: iso(today()), goalId: goalId || undefined, marks: {}, weeks: pick === 'monto' || FREE.includes(pick) ? weeks : undefined }
    addReto(r); setPick(null); go(`/retos/${r.id}`); burst(60)
  }
  return (
    <div className="screen" style={{ gap: 20 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back('/')} aria-label="Regresar"><ArrowLeft /></button><span /></div>
      <div className="col" style={{ gap: 8 }}><h1 className="t-xl">Retos de ahorro</h1><p className="t-body">Un empujón extra con reglas claras. Cada paso que marcas se suma a la meta que elijas.</p></div>
      {retos.length > 0 && (
        <section className="col" style={{ gap: 10 }}>
          <h2 className="t-md">En curso</h2>
          {retos.map(r => {
            const d = def(r), done = Object.keys(r.marks).length
            return (
              <motion.button key={r.id} className="card" whileTap={{ scale: 0.98 }} onClick={() => go(`/retos/${r.id}`)} style={{ gap: 8, textAlign: 'left' }}>
                <div className="row"><b>{d.name}</b><b className="lime">{Math.round((done / d.steps) * 100)}%</b></div>
                <Bar value={done / d.steps} />
                <span className="t-sm">{done} de {d.steps} · {money(retoSaved(r))} de {money(retoTotal(r))}</span>
              </motion.button>
            )
          })}
        </section>
      )}
      <section className="col" style={{ gap: 10 }}>
        <h2 className="t-md">Empezar uno</h2>
        {(Object.keys(RETOS) as RetoKind[]).map((k, i) => {
          const d = RETOS[k]
          return (
            <motion.button key={k} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setPick(k); setBase(d.bases[0]); setWeeks(k === 'diario' || k === 'sube' ? 100 : 20); setGoalId(moneyGoals[0]?.id ?? '') }} style={{ gap: 6, textAlign: 'left' }}>
              <div className="row"><b style={{ fontSize: 17 }}>{d.name}</b><span className="chip">{k === 'monto' || FREE.includes(k) ? 'Tú eliges' : `${d.steps} pasos`}</span></div>
              <span className="t-sm">{d.desc}</span>
            </motion.button>
          )
        })}
      </section>
      <Sheet open={!!pick} onClose={() => setPick(null)}>
        {pick && (
          <>
            <h2 className="t-lg">{RETOS[pick].name}</h2>
            <p className="t-sm">{RETOS[pick].desc}</p>
            <div className="field"><span className="label">{pick === 'monto' ? '¿Cuánto quieres juntar?' : pick === 'diario' ? '¿Cuánto al día?' : pick === 'semanal' ? '¿Cuánto por semana?' : pick === 'sube' ? '¿De cuánto en cuánto sube?' : 'Base'}</span><Chips value={base} onChange={setBase} options={RETOS[pick].bases.map(b => [b, money(b)] as [number, string])} /></div>
            {(pick === 'diario' || pick === 'sube') && <div className="field"><span className="label">¿Por cuántos días?</span><Chips value={weeks} onChange={setWeeks} options={[30, 60, 100, 200, 365].map(w => [w, `${w} días`] as [number, string])} />
              <p className="t-sm">{pick === 'diario' ? `${money(base)} al día × ${weeks} días` : `Día 1: ${money(base)}, día ${weeks}: ${money(base * weeks)}`}</p></div>}
            {pick === 'semanal' && <div className="field"><span className="label">¿Por cuántas semanas?</span><Chips value={weeks} onChange={setWeeks} options={[10, 20, 26, 52].map(w => [w, `${w} semanas`] as [number, string])} /></div>}
            {pick === 'monto' && <div className="field"><span className="label">¿En cuántas semanas?</span><Chips value={weeks} onChange={setWeeks} options={[[10, '10'], [15, '15'], [20, '20'], [26, '26'], [36, '36'], [52, '52']].map(([w]) => [w as number, `${w} semanas`] as [number, string])} />
              <p className="t-sm">Son <b style={{ color: 'var(--ink)' }}>{money(Math.floor(base / weeks))}</b> por semana.</p></div>}
            <div className="card" style={{ background: 'var(--lime-soft)', borderColor: 'transparent', gap: 2 }}>
              <span className="t-xs lime">Al terminar juntas</span>
              <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em' }}>{money(retoTotal({ kind: pick, base, weeks }))}</span>
            </div>
            <div className="field"><span className="label">¿A qué meta va el dinero?</span>
              <Chips value={goalId} onChange={setGoalId} options={[...moneyGoals.map(g => [g.id, g.title] as [string, string]), ['', 'Solo anotar']]} /></div>
            <button className="btn" onClick={start}>Empezar reto</button>
          </>
        )}
      </Sheet>
    </div>
  )
}

function RetoDetail({ id }: { id: string }) {
  const { retos, goals, updateReto, removeReto, addContributionId, removeContribution } = useStore()
  const r = retos.find(x => x.id === id)
  const [del, setDel] = useState(false)
  if (!r) return <div className="screen"><div className="topbar"><button className="iconbtn" onClick={() => go('/retos')} aria-label="Retos"><ArrowLeft /></button></div><p className="empty">Este reto ya no existe.</p></div>
  const d = def(r), done = Object.keys(r.marks).length
  const goal = goals.find(g => g.id === r.goalId)
  const stepDate = (i: number) => iso(new Date(parse(r.start).getTime() + i * (DAILY_KINDS.includes(r.kind) ? 1 : 7) * DAY))
  const toggle = (i: number) => {
    const amount = d.amount(i, r.base)
    if (r.marks[i] !== undefined) {
      const cid = r.marks[i]
      if (goal && cid !== 'x') removeContribution(goal.id, cid)
      updateReto(r.id, x => { delete x.marks[i] })
      return
    }
    const cid = goal ? addContributionId(goal.id, { amount, note: `${d.name} · ${d.unit.toLowerCase()} ${i + 1}`, date: iso(today()) }) : 'x'
    updateReto(r.id, x => { x.marks[i] = cid })
    if (done + 1 === d.steps) { burst(160); toast('Reto completado. Eres otra persona.') } else { burst(20); toast(`+${money(amount)}${goal ? ` a ${goal.title}` : ''}`) }
  }
  const cols = d.steps > 100 ? 10 : d.steps > 52 ? 10 : d.steps > 8 ? 7 : 4
  return (
    <div className="screen" style={{ gap: 20 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back('/retos')} aria-label="Regresar"><ArrowLeft /></button><span className="t-sm">Reto</span><span style={{ width: 42 }} /></div>
      <div className="col" style={{ gap: 6 }}><h1 className="t-xl">{d.name}</h1><p className="t-body">{goal ? `Cada paso se suma a ${goal.title}.` : 'Solo anotas; el dinero no se suma a ninguna meta.'}</p></div>
      <div className="card" style={{ gap: 8 }}>
        <div className="row" style={{ alignItems: 'baseline' }}><span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em' }}>{money(retoSaved(r))}</span><span className="t-sm">de {money(retoTotal(r))}</span></div>
        <Bar value={done / d.steps} />
        <span className="t-sm">{done} de {d.steps} {d.free ? 'sobres abiertos' : 'pasos'} · empezaste el {fShort(r.start)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 6 }}>
        {Array.from({ length: d.steps }, (_, i) => {
          const on = r.marks[i] !== undefined, due = !d.free && stepDate(i) <= iso(today()) && !on
          return (
            <motion.button key={i} whileTap={{ scale: 0.88 }} onClick={() => toggle(i)} aria-pressed={on} aria-label={`${d.unit} ${i + 1}: ${money(d.amount(i, r.base))}`}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: Math.min(i, 60) * 0.006 }}
              style={{ aspectRatio: cols === 4 ? '1.4' : '1', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, lineHeight: 1.1,
                background: on ? 'var(--lime)' : 'var(--card)', color: on ? 'var(--lime-ink)' : 'var(--ink)', border: `1px solid ${due ? 'var(--lime-mark)' : 'var(--line)'}` }}>
              <b style={{ fontSize: cols === 10 ? 11.5 : 13 }}>{d.free || cols === 4 ? money(d.amount(i, r.base)) : i + 1}</b>
              {cols === 7 && <span style={{ fontSize: 9.5, opacity: 0.7 }}>{money(d.amount(i, r.base))}</span>}
              {cols === 4 && <span style={{ fontSize: 11, opacity: 0.7 }}>{d.unit} {i + 1}</span>}
            </motion.button>
          )
        })}
      </div>
      <p className="t-sm">{d.free ? 'Toca el sobre que abriste hoy.' : 'El borde verde marca los pasos que ya tocan.'} Toca uno marcado para deshacerlo.</p>
      {del
        ? <button className="btn danger" onClick={() => { removeReto(r.id); go('/retos', { replace: true }); toast('Reto borrado. Lo apartado se queda en tu meta.') }}><Trash2 size={18} /> Toca otra vez para borrar</button>
        : <button className="btn ghost" onClick={() => setDel(true)}>Borrar reto</button>}
    </div>
  )
}
