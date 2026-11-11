import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { back, go } from '../router'
import { isMoney, pace, payDates } from '../lib/calc'
import { iso, money, parse, today } from '../lib/format'
import { def, DAILY_KINDS, RETOS } from './Retos'

type Ev = { kind: 'pago' | 'fecha' | 'aporte' | 'reto'; text: string; amount?: number; to?: string }

/** Calendario: días de pago, fechas límite, aportes y pasos de retos. */
export default function CalendarScreen() {
  const { goals, retos, profile } = useStore()
  const [off, setOff] = useState(0)
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() + off, 1)
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7
  const mk = iso(first).slice(0, 7)
  const [sel, setSel] = useState(iso(today()))

  const events = useMemo(() => {
    const m: Record<string, Ev[]> = {}
    const add = (d: string, e: Ev) => { if (d.startsWith(mk)) (m[d] ??= []).push(e) }
    const before = new Date(first); before.setDate(0)
    const end = iso(new Date(first.getFullYear(), first.getMonth() + 1, 0))
    const per = goals.filter(g => isMoney(g) && !g.completedAt).reduce((s, g) => s + pace(g, profile.pay).per, 0)
    for (const d of payDates(profile.pay, end, before)) add(d, { kind: 'pago', text: profile.pay === 'variable' ? 'Nueva semana: aparta' : 'Día de pago: aparta', amount: per })
    for (const g of goals) {
      if (!g.completedAt) add(g.due, { kind: 'fecha', text: `Fecha de ${g.title}`, to: `/meta/${g.id}` })
      for (const c of g.contributions) if (c.amount > 0) add(c.date, { kind: 'aporte', text: g.title, amount: c.amount, to: `/meta/${g.id}` })
    }
    for (const r of retos) {
      const d = def(r), step = DAILY_KINDS.includes(r.kind) ? 1 : 7
      for (let i = 0; i < d.steps; i++) {
        if (r.marks[i] !== undefined) continue
        const day = new Date(parse(r.start)); day.setDate(day.getDate() + i * step)
        add(iso(day), { kind: 'reto', text: `${RETOS[r.kind].name} · ${d.unit.toLowerCase()} ${i + 1}`, amount: d.amount(i, r.base), to: `/retos/${r.id}` })
      }
    }
    return m
  }, [goals, retos, profile.pay, mk]) // eslint-disable-line react-hooks/exhaustive-deps

  const color = { pago: 'var(--lime-mark)', fecha: '#ff7a7a', aporte: '#7aa7ff', reto: '#ffc861' }
  const list = events[sel] ?? []
  return (
    <div className="screen" style={{ gap: 18 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back('/')} aria-label="Regresar"><ArrowLeft /></button><span /></div>
      <div className="row">
        <button className="iconbtn" onClick={() => setOff(o => o - 1)} aria-label="Mes anterior"><ChevronLeft /></button>
        <h1 className="t-lg" style={{ textTransform: 'capitalize' }}>{first.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</h1>
        <button className="iconbtn" onClick={() => setOff(o => o + 1)} aria-label="Mes siguiente"><ChevronRight /></button>
      </div>
      <div className="card" style={{ padding: 12, gap: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="t-sm" style={{ fontSize: 11.5 }}>{d}</span>)}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={mk} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: lead }, (_, i) => <span key={'l' + i} />)}
            {Array.from({ length: days }, (_, i) => {
              const d = iso(new Date(first.getFullYear(), first.getMonth(), i + 1))
              const ev = events[d] ?? [], on = d === sel, isToday = d === iso(today())
              const kinds = [...new Set(ev.map(e => e.kind))]
              return (
                <button key={d} type="button" onClick={() => setSel(d)} aria-label={`${i + 1}: ${ev.length} eventos`}
                  style={{ aspectRatio: '1', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    background: on ? 'var(--lime)' : isToday ? 'var(--glass-bg-2)' : 'transparent', color: on ? 'var(--lime-ink)' : 'var(--ink)', border: isToday && !on ? '1px solid var(--lime-mark)' : '1px solid transparent' }}>
                  <b style={{ fontSize: 14 }}>{i + 1}</b>
                  <span style={{ display: 'flex', gap: 2, height: 5 }}>{kinds.map(k => <i key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: on ? 'var(--lime-ink)' : color[k] }} />)}</span>
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="row" style={{ justifyContent: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        {([['pago', 'Día de pago'], ['fecha', 'Fecha límite'], ['aporte', 'Aporte'], ['reto', 'Reto']] as const).map(([k, l]) => (
          <span key={k} className="t-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: color[k] }} />{l}</span>
        ))}
      </div>
      <section className="col" style={{ gap: 6 }}>
        <h2 className="t-md">{parse(sel).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        {list.length ? (
          <div className="list">
            {list.map((e, i) => (
              <button key={i} className="li" onClick={() => e.to && go(e.to)} style={{ textAlign: 'left' }}>
                <i style={{ width: 10, height: 10, borderRadius: '50%', background: color[e.kind], flex: 'none' }} />
                <span style={{ flex: 1 }}>{e.text}</span>
                {e.amount ? <b className={e.kind === 'aporte' ? 'lime' : ''}>{e.kind === 'aporte' ? '+' : ''}{money(e.amount)}</b> : null}
              </button>
            ))}
          </div>
        ) : <p className="t-sm">Nada este día.</p>}
      </section>
    </div>
  )
}
