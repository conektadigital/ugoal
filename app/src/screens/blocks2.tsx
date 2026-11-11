import { motion } from 'framer-motion'
import { Check, Minus, Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { go } from '../router'
import type { Goal } from '../types'
import { mySaved } from '../lib/calc'
import { addDays, fShort, iso, money, parse, today, toNum, typed, uid } from '../lib/format'
import { Bar, Sheet, burst, toast } from '../components/ui'

/* ---------- Bola de nieve: lo que pagas se aplica a la deuda más chica primero ---------- */
export function DebtBlock({ g }: { g: Goal }) {
  const list = [...(g.debts ?? [])].sort((a, b) => a.amount - b.amount)
  let left = mySaved(g)
  const rows = list.map(d => { const paid = Math.min(d.amount, left); left -= paid; return { ...d, paid } })
  const target = rows.find(r => r.paid < r.amount)
  return (
    <section className="col" style={{ gap: 8 }}>
      <div className="row"><h2 className="t-md">Bola de nieve</h2><span className="t-sm">{rows.filter(r => r.paid >= r.amount).length} de {rows.length} liquidadas</span></div>
      {target && (
        <div className="card" style={{ background: 'var(--lime-soft)', borderColor: 'transparent', gap: 2 }}>
          <span className="t-xs lime">Ataca ahora</span>
          <b style={{ fontSize: 20 }}>{target.name}</b>
          <span className="t-sm">Te faltan {money(target.amount - target.paid)} para quitártela de encima. Luego todo va a la siguiente.</span>
        </div>
      )}
      <div className="list">
        {rows.map((r, i) => {
          const done = r.paid >= r.amount
          return (
            <motion.div key={r.id} className="li" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <span style={{ width: 32, height: 32, borderRadius: 11, display: 'grid', placeItems: 'center', fontWeight: 700, flex: 'none', background: done ? 'var(--lime)' : 'var(--card-2)', color: done ? 'var(--lime-ink)' : 'var(--ink)' }}>{done ? <Check size={16} /> : i + 1}</span>
              <span className="col" style={{ flex: 1, gap: 6 }}>
                <span className="row"><b style={{ textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--muted)' : 'var(--ink)' }}>{r.name}</b><span className="t-sm">{money(r.paid)} / {money(r.amount)}</span></span>
                <Bar value={r.paid / r.amount} />
              </span>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- Negocio abierto: ventas, gastos y cuánto llevas recuperado ---------- */
export function BizBlock({ g }: { g: Goal }) {
  const { updateGoal } = useStore()
  const biz = g.biz ?? { open: false, logs: [] }
  const [sheet, setSheet] = useState<'venta' | 'gasto' | null>(null)
  const [amt, setAmt] = useState(''), [note, setNote] = useState('')
  const ventas = biz.logs.filter(l => l.kind === 'venta').reduce((s, l) => s + l.amount, 0)
  const gastos = biz.logs.filter(l => l.kind === 'gasto').reduce((s, l) => s + l.amount, 0)
  const ganancia = ventas - gastos
  const month = iso(today()).slice(0, 7)
  const mV = biz.logs.filter(l => l.kind === 'venta' && l.date.startsWith(month)).reduce((s, l) => s + l.amount, 0)
  const mG = biz.logs.filter(l => l.kind === 'gasto' && l.date.startsWith(month)).reduce((s, l) => s + l.amount, 0)
  const inv = g.price || 1
  const rec = Math.max(0, ganancia / inv)
  if (!biz.open) return (
    <section className="card" style={{ gap: 8 }}>
      <b>¿Ya abriste?</b>
      <p className="t-sm">Cuando arranques, anota tus ventas y gastos y te decimos cuánto llevas recuperado de tu inversión.</p>
      <button className="btn sm" onClick={() => { updateGoal(g.id, x => { x.biz = { open: true, logs: x.biz?.logs ?? [] } }); burst(80); toast('¡Negocio abierto! Ahora a vender.') }}>Ya abrí mi negocio</button>
    </section>
  )
  const save = () => {
    const a = toNum(amt); if (!(a > 0) || !sheet) return
    updateGoal(g.id, x => { x.biz!.logs = [{ id: uid(), date: iso(today()), amount: a, kind: sheet, note: note.trim() || undefined }, ...x.biz!.logs] })
    setSheet(null); if (sheet === 'venta') { burst(25); toast(`+${money(a)} en ventas`) } else toast('Gasto anotado')
  }
  return (
    <section className="col" style={{ gap: 10 }}>
      <h2 className="t-md">Tu negocio</h2>
      <div className="card" style={{ gap: 8 }}>
        <span className="t-xs">Recuperaste</span>
        <div className="row" style={{ alignItems: 'baseline' }}><span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em' }}>{Math.round(rec * 100)}%</span><span className="t-sm">de {money(inv)} invertidos</span></div>
        <Bar value={rec} />
        <span className="t-sm">{rec >= 1 ? 'Ya recuperaste tu inversión. Todo lo demás es ganancia.' : `Te faltan ${money(Math.max(0, inv - ganancia))} de ganancia para recuperarla.`}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {[['Ventas del mes', mV], ['Gastos del mes', mG], ['Ganancia del mes', mV - mG]].map(([l, v]) => (
          <div key={l as string} className="card" style={{ padding: 12, gap: 2 }}><span className="t-sm" style={{ fontSize: 11.5 }}>{l}</span><b style={{ fontSize: 16, color: (v as number) < 0 ? 'var(--warn)' : 'var(--ink)' }}>{money(v as number)}</b></div>
        ))}
      </div>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn" style={{ flex: 1 }} onClick={() => { setAmt(''); setNote(''); setSheet('venta') }}><Plus /> Venta</button>
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => { setAmt(''); setNote(''); setSheet('gasto') }}><Minus /> Gasto</button>
      </div>
      {biz.logs.length > 0 && (
        <div className="list">
          {biz.logs.slice(0, 6).map(l => (
            <div key={l.id} className="li"><span className="col" style={{ flex: 1, gap: 0 }}><b>{l.note || (l.kind === 'venta' ? 'Venta' : 'Gasto')}</b><span className="t-sm">{fShort(l.date)}</span></span>
              <b style={{ color: l.kind === 'venta' ? 'var(--lime-text)' : 'var(--warn)' }}>{l.kind === 'venta' ? '+' : '−'}{money(l.amount)}</b></div>
          ))}
        </div>
      )}
      <Sheet open={!!sheet} onClose={() => setSheet(null)}>
        <h2 className="t-lg">{sheet === 'venta' ? 'Nueva venta' : 'Nuevo gasto'}</h2>
        <label className="money-input"><span>$</span><input inputMode="decimal" placeholder="0" autoFocus value={amt} onChange={e => setAmt(typed(e.target.value))} aria-label="Monto" /></label>
        <input className="input" placeholder={sheet === 'venta' ? 'Ventas del día, pedido de…' : 'Insumos, renta, luz…'} value={note} onChange={e => setNote(e.target.value)} maxLength={40} />
        <button className="btn" onClick={save}>Guardar</button>
      </Sheet>
    </section>
  )
}

/* ---------- Escuela: al cumplir, armar el siguiente semestre ---------- */
export function SchoolNext({ g }: { g: Goal }) {
  const { addGoal } = useStore()
  if (!g.repeat || !g.completedAt) return null
  const next = () => {
    const id = uid(), start = iso(today())
    const due = addDays(g.due, 182) < start ? addDays(start, 182) : addDays(g.due, 182)
    addGoal({ ...structuredClone(g), id, start, due, contributions: [], completedAt: undefined, createdAt: start, letter: undefined, title: g.title.replace(/ ?\(.*\)$/, '') + ` (${parse(due).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })})` })
    go(`/meta/${id}`, { replace: true }); burst(60); toast('Siguiente semestre listo. A darle.')
  }
  return (
    <section className="card" style={{ gap: 8 }}>
      <b>¿Siguiente semestre?</b>
      <p className="t-sm">Armamos la misma meta para el siguiente pago, con el mismo desglose.</p>
      <button className="btn sm" onClick={next}><RefreshCw size={16} /> Armar el siguiente</button>
    </section>
  )
}

