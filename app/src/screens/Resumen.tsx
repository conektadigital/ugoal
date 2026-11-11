import { motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { back } from '../router'
import { isMoney, progress, streak } from '../lib/calc'
import { money, num } from '../lib/format'
import { Bar, Photo } from '../components/ui'

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthName = (d: Date, opt: 'long' | 'short' = 'long') => d.toLocaleDateString('es-MX', { month: opt })

export default function Resumen({ prev }: { prev?: boolean }) {
  const { goals } = useStore()
  const now = new Date()
  const [offset, setOffset] = useState(prev ? -1 : 0)
  const sel = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const k = key(sel)
  const months = Array.from({ length: 6 }, (_, i) => new Date(sel.getFullYear(), sel.getMonth() - 5 + i, 1))
  const inMonth = (mk: string) => goals.flatMap(g => g.contributions.filter(c => c.amount > 0 && c.date.startsWith(mk)))
  const totals = months.map(m => inMonth(key(m)).reduce((s, c) => s + c.amount, 0))
  const total = totals[5], before = totals[4]
  const contribs = inMonth(k)
  const perGoal = goals.filter(isMoney).map(g => ({ g, v: g.contributions.filter(c => c.amount > 0 && c.date.startsWith(k)).reduce((s, c) => s + c.amount, 0) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v)
  const hours = goals.flatMap(g => g.study?.logs ?? []).filter(l => l.date.startsWith(k)).reduce((s, l) => s + l.minutes, 0) / 60
  const habitDays = goals.flatMap(g => g.habit?.checks ?? []).filter(d => d.startsWith(k)).length
  const closest = goals.filter(g => !g.completedAt).sort((a, b) => progress(b) - progress(a))[0]
  const doneThisMonth = goals.filter(g => g.completedAt?.startsWith(k))
  const maxV = Math.max(1, ...totals)
  const [tip, setTip] = useState<number | null>(null)
  const st = streak(goals)
  const delta = before > 0 ? Math.round(((total - before) / before) * 100) : null

  return (
    <div className="screen" style={{ gap: 20 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back('/')} aria-label="Regresar"><ArrowLeft /></button><span /></div>
      <div className="row">
        <button className="iconbtn" onClick={() => setOffset(o => o - 1)} aria-label="Mes anterior"><ChevronLeft /></button>
        <div className="col" style={{ alignItems: 'center', gap: 0 }}><span className="t-xs">Tu resumen</span><h1 className="t-lg" style={{ textTransform: 'capitalize' }}>{monthName(sel)} {sel.getFullYear()}</h1></div>
        <button className="iconbtn" onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset >= 0} style={{ opacity: offset >= 0 ? 0.3 : 1 }} aria-label="Mes siguiente"><ChevronRight /></button>
      </div>

      <section className="card" style={{ gap: 6, padding: 22 }}>
        <span className="t-sm">Apartaste</span>
        <motion.span key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.05em' }}>{money(total)}</motion.span>
        <span className="t-sm">{contribs.length} {contribs.length === 1 ? 'aporte' : 'aportes'}{delta !== null && <> · <b style={{ color: delta >= 0 ? 'var(--lime-text)' : 'var(--warn)' }}>{delta >= 0 ? '+' : ''}{delta}%</b> contra {monthName(months[4])}</>}</span>
      </section>

      <section className="col" style={{ gap: 10 }}>
        <h2 className="t-md">Últimos 6 meses</h2>
        <div className="card" style={{ padding: '18px 14px 12px', gap: 0 }}>
          <div style={{ position: 'relative', height: 150, display: 'flex', alignItems: 'flex-end', gap: 10 }} onPointerLeave={() => setTip(null)}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderTop: '1px solid var(--line)' }} />
            {totals.map((v, i) => (
              <button key={i} type="button" onPointerEnter={() => setTip(i)} onClick={() => setOffset(offset - (5 - i))} aria-label={`${monthName(months[i])}: ${money(v)}`}
                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                {(tip === i || (tip === null && i === 5)) && v > 0 && <span style={{ position: 'absolute', bottom: `calc(${(v / maxV) * 82}% + 6px)`, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--ink)' }}>{money(v)}</span>}
                <motion.i key={k + i} initial={{ height: 0 }} animate={{ height: `${(v / maxV) * 82}%` }} transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  style={{ width: '100%', maxWidth: 34, minHeight: v > 0 ? 3 : 0, borderRadius: '4px 4px 0 0', background: i === 5 ? 'var(--lime-mark)' : 'rgba(140,145,150,0.38)', outline: tip === i && i !== 5 ? '1.5px solid var(--lime-mark)' : 'none' }} />
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {months.map((m, i) => <span key={i} className="t-sm" style={{ flex: 1, textAlign: 'center', fontSize: 11.5, textTransform: 'capitalize', color: i === 5 ? 'var(--ink)' : 'var(--muted)', fontWeight: i === 5 ? 700 : 400 }}>{monthName(m, 'short').replace('.', '')}</span>)}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {[[<Flame key="f" size={18} />, `${st}`, st === 1 ? 'semana seguida' : 'semanas seguidas'], ['h', num(hours), 'horas de estudio'], ['✓', `${habitDays}`, 'días de hábito']].map(([i, v, l], idx) => (
          <div key={idx} className="card" style={{ padding: 14, gap: 4 }}><span className="lime" style={{ fontWeight: 800 }}>{i}</span><b style={{ fontSize: 20, letterSpacing: '-0.03em' }}>{v}</b><span className="t-sm" style={{ fontSize: 12 }}>{l}</span></div>
        ))}
      </section>

      {perGoal.length > 0 && (
        <section className="col" style={{ gap: 6 }}>
          <h2 className="t-md">A dónde fue</h2>
          <div className="list">
            {perGoal.map(({ g, v }) => (
              <div key={g.id} className="li">
                <div style={{ width: 44, flex: 'none' }}><Photo src={g.photo} mode={g.photoMode} ratio="1/1" shade={false} /></div>
                <span className="col" style={{ flex: 1, gap: 6, minWidth: 0 }}>
                  <span className="row"><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</b><b>{money(v)}</b></span>
                  <Bar value={v / total} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {doneThisMonth.length > 0 && <div className="card" style={{ background: 'var(--lime-soft)', borderColor: 'transparent' }}><b>Cumpliste {doneThisMonth.map(g => g.title).join(', ')}.</b></div>}
      {closest && <div className="card" style={{ gap: 4 }}><span className="t-xs">La más cerca</span><b style={{ fontSize: 18 }}>{closest.title}</b><span className="t-sm">Vas en {Math.round(progress(closest) * 100)}%. {progress(closest) > 0.7 ? 'Ya casi. No aflojes.' : 'Cada aporte la acerca.'}</span></div>}
      {total === 0 && contribs.length === 0 && <p className="t-sm" style={{ textAlign: 'center' }}>Este mes todavía no hay aportes. El primero es el que más cuesta.</p>}
    </div>
  )
}
