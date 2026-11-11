import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Check, Lock, Minus, Pause, Play, Plus, RotateCcw, Square, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { Goal } from '../types'
import { cleanDays, creditPayment, daysBetween, daysUnder, freqPlural, freqWord, pace, progress, projection, remaining, simulate, studyHours, viceLimit } from '../lib/calc'
import { DAY, daysUntil, fDate, fShort, iso, money, num, parse, today, toNum, typed, uid } from '../lib/format'
import { AFTER_WORKOUT, RELAPSE, pick } from '../lib/phrases'
import { Ring, Sheet, burst, toast } from '../components/ui'

type Check = (fn: (x: Goal) => void, msg?: string) => void

/* ---------- Carta sellada ---------- */
export function LetterCard({ g }: { g: Goal }) {
  const [open, setOpen] = useState(false)
  if (!g.letter) return null
  const done = !!g.completedAt
  return (
    <section className="card" style={{ gap: 8, background: done ? 'var(--lime-soft)' : 'var(--card)', borderStyle: done ? 'solid' : 'dashed' }}>
      <div className="row"><b style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={16} /> Carta a tu yo del futuro</b><span className="t-sm">{fShort(g.createdAt)}</span></div>
      {done
        ? open ? <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{g.letter}</p> : <button className="btn sm" onClick={() => setOpen(true)}>Abrir mi carta</button>
        : <p className="t-sm">Sellada. Se abre el día que cumplas esta meta. Vas en {Math.round(progress(g) * 100)}%.</p>}
    </section>
  )
}

/* ---------- Enganche: mensualidad aproximada ---------- */
export function CreditCard({ g }: { g: Goal }) {
  const c = g.credit!
  return (
    <section className="card" style={{ gap: 6 }}>
      <span className="t-xs">Después del enganche</span>
      <div className="row" style={{ alignItems: 'baseline' }}><span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>{money(creditPayment(c))}<span className="t-sm"> /mes</span></span><span className="t-sm">{c.months} meses</span></div>
      <span className="t-sm">Precio completo {money(c.full)} · enganche {c.pct}% · tasa aprox. {c.rate}% anual. Es una referencia: la agencia o el banco te dan la cifra exacta.</span>
    </section>
  )
}

/* ---------- Fecha fija: ¿llegas con tu ritmo real? ---------- */
export function FixedDateCard({ g }: { g: Goal }) {
  if (!g.fixed || g.completedAt) return null
  const pr = projection(g)
  const d = daysUntil(g.due)
  if (!pr) return (
    <section className="card" style={{ gap: 4 }}>
      <span className="t-xs">Fecha que no se mueve</span>
      <b style={{ fontSize: 18 }}>Faltan {d} días · {fDate(g.due)}</b>
      <span className="t-sm">En dos semanas te decimos si con tu ritmo real llegas a tiempo.</span>
    </section>
  )
  const late = pr.late > 0
  return (
    <section className="card" style={{ gap: 4, background: late ? 'var(--warn-soft)' : 'var(--lime-soft)', borderColor: 'transparent' }}>
      <span className="t-xs" style={{ color: late ? 'var(--warn)' : 'var(--lime-text)' }}>Fecha que no se mueve · faltan {d} días</span>
      <b style={{ fontSize: 18 }}>{late ? `Con tu ritmo llegas el ${fDate(pr.date)}: ${pr.late} días tarde.` : `Con tu ritmo llegas el ${fDate(pr.date)}. A tiempo.`}</b>
      {late && <span className="t-sm" style={{ color: 'var(--ink-2)' }}>Esta fecha no se mueve. Sube tu aporte o recorta algo del plan.</span>}
    </section>
  )
}

/* ---------- ¿Y si aparto más? ---------- */
export function SimBlock({ g }: { g: Goal }) {
  const { profile } = useStore()
  const base = Math.max(10, Math.ceil(pace(g, profile.pay).per / 10) * 10)
  const max = Math.max(base * 3, Math.ceil(remaining(g) / 10) * 10 > base * 3 ? base * 3 : base * 2)
  const [v, setV] = useState(base)
  if (remaining(g) <= 0) return null
  const s = simulate(g, v, profile.pay)
  const diff = s ? Math.round(daysBetween(g.due, s.date) / 30.4) : 0
  return (
    <section className="card" style={{ gap: 10 }}>
      <div className="row"><b>¿Y si aparto más?</b><span className="t-sm">cada {freqWord(profile.pay)}</span></div>
      <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em' }}>{money(v)}</span>
      <input type="range" min={10} max={max} step={10} value={v} onChange={e => setV(+e.target.value)} aria-label="Monto por pago" style={{ width: '100%', accentColor: 'var(--lime-mark)' }} />
      {s && <span className="t-body">La cumples el <b style={{ color: 'var(--ink)' }}>{fDate(s.date)}</b> · {s.periods} {freqPlural(profile.pay)}{diff < 0 ? <b className="lime"> · {-diff} {diff === -1 ? 'mes' : 'meses'} antes</b> : diff > 0 ? <b style={{ color: 'var(--warn)' }}> · {diff} {diff === 1 ? 'mes' : 'meses'} después</b> : ' · justo a tiempo'}</span>}
    </section>
  )
}

/* ---------- Fondo de emergencia: registrar cuando lo usas ---------- */
export function EmergencyUse({ g }: { g: Goal }) {
  const { addContribution } = useStore()
  const [open, setOpen] = useState(false)
  const [amt, setAmt] = useState(''), [why, setWhy] = useState('')
  return (
    <>
      <button className="btn ghost" onClick={() => { setAmt(''); setWhy(''); setOpen(true) }}>Usé mi fondo</button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <h2 className="t-lg">Para eso es el fondo</h2>
        <p className="t-sm">Anota cuánto usaste. Lo descontamos y te decimos cuánto toca para volver a llenarlo.</p>
        <label className="money-input"><span>$</span><input inputMode="decimal" placeholder="0" value={amt} autoFocus onChange={e => setAmt(typed(e.target.value))} aria-label="Monto usado" /></label>
        <input className="input" placeholder="¿Para qué? (doctor, coche, renta…)" value={why} onChange={e => setWhy(e.target.value)} maxLength={40} />
        <button className="btn" onClick={() => { const a = toNum(amt); if (!(a > 0)) return; addContribution(g.id, { amount: -a, note: `Emergencia${why.trim() ? ': ' + why.trim() : ''}`, date: iso(today()) }); setOpen(false); toast('Registrado. Bien que lo tenías.') }}>Registrar</button>
      </Sheet>
    </>
  )
}

/* ---------- Vicios ---------- */
const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365]
export function ViceBlock({ g, check }: { g: Goal; check: Check }) {
  const v = g.vice!
  return v.mode === 'dejar' ? <QuitBlock g={g} check={check} /> : <CutBlock g={g} check={check} />
}

function QuitBlock({ g, check }: { g: Goal; check: Check }) {
  const v = g.vice!, days = cleanDays(g), best = Math.max(v.best, days)
  const [confirm, setConfirm] = useState(false)
  const next = MILESTONES.find(m => m > days) ?? v.targetDays
  const relapse = () => {
    check(x => { const vv = x.vice!; vv.best = Math.max(vv.best, cleanDays(x)); vv.relapses.push(iso(today())); vv.since = iso(today()) })
    setConfirm(false); toast(pick(RELAPSE))
  }
  return (
    <>
      <section className="row" style={{ gap: 18 }}>
        <Ring value={progress(g)} size={124} stroke={12}>
          <span className="col" style={{ alignItems: 'center', gap: 0 }}><span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.05em' }}>{days}</span><span className="t-sm" style={{ fontSize: 12 }}>{days === 1 ? 'día' : 'días'}</span></span>
        </Ring>
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <span className="t-sm">Días limpio</span>
          <span className="t-md">Meta: {v.targetDays} días</span>
          <span className="t-sm">Mejor marca: <b style={{ color: 'var(--ink)' }}>{best} días</b>{v.relapses.length ? ` · ${v.relapses.length} ${v.relapses.length === 1 ? 'tropiezo' : 'tropiezos'}` : ''}</span>
        </div>
      </section>
      <section className="card" style={{ gap: 10 }}>
        <div className="row"><b>Siguiente logro</b><span className="t-sm">en {next - days} {next - days === 1 ? 'día' : 'días'}</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MILESTONES.filter(m => m <= Math.max(v.targetDays, 30)).map(m => (
            <span key={m} className={`chip ${days >= m ? 'lime' : ''}`} style={{ height: 32 }}>{days >= m && <Check />}{m >= 30 && m % 30 === 0 && m < 365 ? `${m / 30} ${m === 30 ? 'mes' : 'meses'}` : m === 365 ? '1 año' : `${m} ${m === 1 ? 'día' : 'días'}`}</span>
          ))}
        </div>
      </section>
      <AnimatePresence mode="wait">
        {confirm ? (
          <motion.div key="c" className="col" style={{ gap: 8 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <p className="t-sm" style={{ textAlign: 'center' }}>Recaer no borra lo que avanzaste. Tu mejor marca ({best} días) se queda.</p>
            <button className="btn danger" onClick={relapse}>Sí, recaí. Empiezo de nuevo hoy</button>
            <button className="btn ghost" onClick={() => setConfirm(false)}>Cancelar</button>
          </motion.div>
        ) : <motion.button key="r" className="btn ghost" onClick={() => setConfirm(true)}><RotateCcw size={18} /> Recaí</motion.button>}
      </AnimatePresence>
    </>
  )
}

function CutBlock({ g, check }: { g: Goal; check: Check }) {
  const v = g.vice!, t = iso(today())
  const limit = viceLimit(g), cnt = v.logs[t] ?? 0, logged = t in v.logs
  const week = Math.min(v.weeks, Math.floor(daysBetween(g.start, t) / 7) + 1)
  const setCnt = (n: number) => check(x => { x.vice!.logs[t] = Math.max(0, n) })
  const last7 = Array.from({ length: 7 }, (_, i) => iso(new Date(today().getTime() - (6 - i) * DAY))).filter(d => d >= g.start)
  const maxV = Math.max(1, v.startPerDay, ...last7.map(d => v.logs[d] ?? 0))
  return (
    <>
      <section className="row" style={{ gap: 18 }}>
        <Ring value={progress(g)} size={124} stroke={12}><span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{Math.round(progress(g) * 100)}%</span></Ring>
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <span className="t-sm">Semana {week} de {v.weeks}</span>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em' }}>{limit} <span style={{ fontSize: 15, color: 'var(--muted)' }}>{v.unit} al día</span></span>
          <span className="t-sm">Empezaste en {v.startPerDay} · {daysUnder(g)} días dentro del límite</span>
        </div>
      </section>
      <section className="card" style={{ gap: 12, alignItems: 'center' }}>
        <span className="t-sm">Hoy llevas</span>
        <div className="row" style={{ gap: 24, justifyContent: 'center' }}>
          <button className="iconbtn" style={{ width: 54, height: 54 }} onClick={() => setCnt(cnt - 1)} aria-label="Uno menos"><Minus /></button>
          <span style={{ fontSize: 54, fontWeight: 800, letterSpacing: '-0.05em', minWidth: 70, textAlign: 'center', color: cnt > limit ? 'var(--warn)' : 'var(--ink)' }}>{cnt}</span>
          <button className="iconbtn" style={{ width: 54, height: 54 }} onClick={() => setCnt(cnt + 1)} aria-label="Uno más"><Plus /></button>
        </div>
        <span className="t-sm" style={{ color: cnt > limit ? 'var(--warn)' : 'var(--lime-text)', fontWeight: 600 }}>{cnt > limit ? `Te pasaste por ${cnt - limit}. Mañana se vuelve a intentar.` : !logged ? 'Toca + o − para anotar tu día.' : `Vas dentro de tu límite de ${limit}.`}</span>
        {!logged && <button className="btn sm" onClick={() => { setCnt(0); burst(30); toast('Cero hoy. Eso es fuerza.') }}>Hoy fue cero</button>}
      </section>
      <section className="col" style={{ gap: 10 }}>
        <h2 className="t-md">Últimos 7 días</h2>
        <div className="card" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 150, padding: '16px 14px 10px' }}>
          {last7.map(d => {
            const val = v.logs[d], lim = viceLimit(g, d), over = val !== undefined && val > lim
            return (
              <div key={d} className="col" style={{ flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{val ?? '–'}</span>
                <motion.i initial={{ height: 0 }} animate={{ height: `${((val ?? 0) / maxV) * 70}%` }} style={{ width: '100%', maxWidth: 26, minHeight: val !== undefined ? 4 : 0, borderRadius: 6, background: over ? 'var(--warn)' : 'var(--lime-mark)' }} />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{parse(d).toLocaleDateString('es-MX', { weekday: 'narrow' })}</span>
              </div>
            )
          })}
        </div>
        <span className="t-sm">Lima: dentro del límite · naranja: te pasaste.</span>
      </section>
    </>
  )
}

/* ---------- Estudios ---------- */
export function StudyBlock({ g, check }: { g: Goal; check: Check }) {
  const s = g.study!
  if (s.mode === 'horas') return <HoursBlock g={g} check={check} />
  if (s.mode === 'examen') return <ExamBlock g={g} check={check} />
  return <BooksBlock g={g} check={check} />
}

const FOCUS_KEY = 'ugoal-focus'
type Focus = { goalId: string; end: number; minutes: number; pausedLeft?: number }
const readFocus = (): Focus | null => { try { return JSON.parse(localStorage.getItem(FOCUS_KEY) || 'null') } catch { return null } }
const writeFocus = (f: Focus | null) => { try { f ? localStorage.setItem(FOCUS_KEY, JSON.stringify(f)) : localStorage.removeItem(FOCUS_KEY) } catch { /* sin almacenamiento */ } }

function HoursBlock({ g, check }: { g: Goal; check: Check }) {
  const s = g.study!, hrs = studyHours(g)
  const [focus, setFocus] = useState<Focus | null>(() => { const f = readFocus(); return f?.goalId === g.id ? f : null })
  const [now, setNow] = useState(Date.now())
  const [manual, setManual] = useState(false), [mv, setMv] = useState('')
  useEffect(() => { if (!focus || focus.pausedLeft !== undefined) return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t) }, [focus])
  const left = focus ? (focus.pausedLeft ?? Math.max(0, focus.end - now)) : 0
  const log = (min: number, msg: string) => { check(x => { x.study!.logs = [{ date: iso(today()), minutes: min }, ...x.study!.logs] }, msg); burst(40) }
  useEffect(() => {
    if (focus && focus.pausedLeft === undefined && left <= 0) { log(focus.minutes, `+${focus.minutes} min de enfoque. ${pick(AFTER_WORKOUT)}`); setFocus(null); writeFocus(null) }
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps
  const start = (m: number) => { const f = { goalId: g.id, end: Date.now() + m * 60000, minutes: m }; setFocus(f); writeFocus(f); setNow(Date.now()) }
  const pause = () => { if (!focus) return; const f = focus.pausedLeft === undefined ? { ...focus, pausedLeft: left } : { ...focus, end: Date.now() + (focus.pausedLeft ?? 0), pausedLeft: undefined }; setFocus(f); writeFocus(f); setNow(Date.now()) }
  const stop = () => { if (!focus) return; const done = Math.floor((focus.minutes * 60000 - left) / 60000); if (done >= 5) log(done, `+${done} min. Cuenta igual.`); else toast('Menos de 5 minutos no cuenta. La próxima.'); setFocus(null); writeFocus(null) }
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000)
  const week = s.logs.filter(l => daysBetween(l.date, iso(today())) < 7).reduce((a, l) => a + l.minutes, 0) / 60
  return (
    <>
      <section className="row" style={{ gap: 18 }}>
        <Ring value={progress(g)} size={124} stroke={12}><span className="col" style={{ alignItems: 'center', gap: 0 }}><span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.045em' }}>{num(hrs)}</span><span className="t-sm" style={{ fontSize: 12 }}>de {s.target} h</span></span></Ring>
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <span className="t-sm">Horas de enfoque</span>
          <span className="t-md">{num(week)} h esta semana</span>
          <span className="t-sm">Te faltan {num(Math.max(0, s.target - hrs))} h</span>
        </div>
      </section>
      <section className="card" style={{ alignItems: 'center', gap: 14, padding: 22 }}>
        {focus ? (
          <>
            <span className="t-xs lime">{focus.pausedLeft !== undefined ? 'En pausa' : 'Enfocado'}</span>
            <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums' }}>{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</span>
            <div className="row" style={{ gap: 10, width: '100%' }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={pause}>{focus.pausedLeft !== undefined ? <><Play size={18} /> Seguir</> : <><Pause size={18} /> Pausa</>}</button>
              <button className="btn ghost" style={{ flex: 1 }} onClick={stop}><Square size={16} /> Terminar</button>
            </div>
            <span className="t-sm" style={{ textAlign: 'center' }}>Deja el celular boca abajo. Si sales de la app, el tiempo sigue corriendo.</span>
          </>
        ) : (
          <>
            <span className="t-xs">Temporizador de enfoque</span>
            <div className="row" style={{ gap: 10, width: '100%' }}>
              {[25, 50, 90].map(m => <button key={m} className={m === 25 ? 'btn' : 'btn ghost'} style={{ flex: 1, height: 52, padding: 0, gap: 6, whiteSpace: 'nowrap', fontSize: 15 }} onClick={() => start(m)}><Play size={15} />{m} min</button>)}
            </div>
            <button className="link" onClick={() => { setMv(''); setManual(true) }}>Anotar horas a mano</button>
          </>
        )}
      </section>
      {s.logs.length > 0 && (
        <section className="col" style={{ gap: 4 }}>
          <h2 className="t-md">Sesiones</h2>
          <div className="list">
            {s.logs.slice(0, 8).map((l, i) => (
              <div key={i} className="li"><span style={{ flex: 1 }}>{fShort(l.date)}</span><b className="lime">{l.minutes >= 60 ? `${num(l.minutes / 60)} h` : `${l.minutes} min`}</b>
                <button aria-label="Borrar sesión" style={{ color: 'var(--muted)' }} onClick={() => check(x => { x.study!.logs.splice(i, 1) }, 'Sesión borrada')}><Trash2 size={16} /></button></div>
            ))}
          </div>
        </section>
      )}
      <Sheet open={manual} onClose={() => setManual(false)}>
        <h2 className="t-lg">¿Cuánto estudiaste?</h2>
        <label className="money-input"><input inputMode="decimal" placeholder="0" autoFocus value={mv} onChange={e => setMv(e.target.value.replace(/[^0-9.]/g, ''))} aria-label="Horas" /><span style={{ fontSize: 22 }}>horas</span></label>
        <button className="btn" onClick={() => { const h = parseFloat(mv); if (!(h > 0)) return; setManual(false); log(Math.round(h * 60), 'Horas anotadas.') }}>Guardar</button>
      </Sheet>
    </>
  )
}

function ExamBlock({ g, check }: { g: Goal; check: Check }) {
  const s = g.study!, topics = s.topics ?? [], done = topics.filter(t => t.done).length
  const d = Math.max(0, daysUntil(g.due)), weeks = Math.max(1, Math.ceil(d / 7))
  const perWeek = Math.ceil((topics.length - done) / weeks)
  const [txt, setTxt] = useState('')
  return (
    <>
      <section className="row" style={{ gap: 18 }}>
        <Ring value={progress(g)} size={124} stroke={12}><span className="col" style={{ alignItems: 'center', gap: 0 }}><span style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.05em' }}>{d}</span><span className="t-sm" style={{ fontSize: 12 }}>{d === 1 ? 'día' : 'días'}</span></span></Ring>
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <span className="t-sm">Examen el {fDate(g.due)}</span>
          <span className="t-md">{done} de {topics.length} temas listos</span>
          {done < topics.length && <span className="t-sm">Te tocan <b style={{ color: 'var(--ink)' }}>{perWeek} {perWeek === 1 ? 'tema' : 'temas'} por semana</b></span>}
        </div>
      </section>
      <section className="col" style={{ gap: 4 }}>
        <h2 className="t-md">Temario</h2>
        <div className="list">
          {topics.map(t => (
            <div key={t.id} className="li">
              <motion.button whileTap={{ scale: 0.85 }} className={`check ${t.done ? 'on' : ''}`} aria-pressed={t.done} aria-label={t.text}
                onClick={() => { check(x => { const it = x.study!.topics!.find(y => y.id === t.id)!; it.done = !it.done }, t.done ? undefined : 'Un tema menos.'); if (!t.done) burst(25) }}>{t.done && <Check />}</motion.button>
              <span style={{ flex: 1, color: t.done ? 'var(--muted)' : 'var(--ink)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
              <button aria-label="Quitar" onClick={() => check(x => { x.study!.topics = x.study!.topics!.filter(y => y.id !== t.id) })} style={{ color: 'var(--muted)' }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <form style={{ display: 'flex', gap: 8, marginTop: 6 }} onSubmit={e => { e.preventDefault(); if (!txt.trim()) return; check(x => { x.study!.topics = [...(x.study!.topics ?? []), { id: uid(), text: txt.trim(), done: false }] }); setTxt('') }}>
          <input className="input" style={{ height: 48 }} placeholder="Agregar tema" value={txt} onChange={e => setTxt(e.target.value)} aria-label="Nuevo tema" />
          <button className="iconbtn" style={{ width: 48, height: 48, flex: 'none', background: 'var(--lime)', color: 'var(--lime-ink)' }} aria-label="Agregar"><Plus /></button>
        </form>
      </section>
    </>
  )
}

function BooksBlock({ g, check }: { g: Goal; check: Check }) {
  const s = g.study!, books = s.books ?? [], done = books.filter(b => b.done).length
  const elapsed = Math.max(1, daysBetween(g.start, iso(today())))
  const total = Math.max(1, daysBetween(g.start, g.due))
  const projected = done ? Math.round((done / elapsed) * total) : 0
  const [txt, setTxt] = useState('')
  return (
    <>
      <section className="row" style={{ gap: 18 }}>
        <Ring value={progress(g)} size={124} stroke={12}><span className="col" style={{ alignItems: 'center', gap: 0 }}><span style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.05em' }}>{done}</span><span className="t-sm" style={{ fontSize: 12 }}>de {s.target}</span></span></Ring>
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <span className="t-sm">Libros terminados</span>
          <span className="t-md">Uno cada {Math.round(total / s.target)} días</span>
          {done > 0 && <span className="t-sm">A este paso: <b style={{ color: 'var(--ink)' }}>{projected} libros</b> para el {fShort(g.due)}</span>}
        </div>
      </section>
      <section className="col" style={{ gap: 4 }}>
        <h2 className="t-md">Mi lista</h2>
        {books.length ? (
          <div className="list">
            {books.map(b => (
              <div key={b.id} className="li">
                <motion.button whileTap={{ scale: 0.85 }} className={`check ${b.done ? 'on' : ''}`} aria-pressed={b.done} aria-label={b.title}
                  onClick={() => { check(x => { const it = x.study!.books!.find(y => y.id === b.id)!; it.done = !it.done }, b.done ? undefined : 'Libro terminado. Siguiente.'); if (!b.done) burst(40) }}>{b.done && <Check />}</motion.button>
                <span style={{ flex: 1, color: b.done ? 'var(--muted)' : 'var(--ink)' }}>{b.title}</span>
                <button aria-label="Quitar" onClick={() => check(x => { x.study!.books = x.study!.books!.filter(y => y.id !== b.id) })} style={{ color: 'var(--muted)' }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        ) : <p className="t-sm" style={{ padding: '8px 0', display: 'flex', gap: 8, alignItems: 'center' }}><BookOpen size={16} /> Agrega el libro que estás leyendo y los que siguen.</p>}
        <form style={{ display: 'flex', gap: 8, marginTop: 6 }} onSubmit={e => { e.preventDefault(); if (!txt.trim()) return; check(x => { x.study!.books = [...(x.study!.books ?? []), { id: uid(), title: txt.trim(), done: false }] }); setTxt('') }}>
          <input className="input" style={{ height: 48 }} placeholder="Título del libro" value={txt} onChange={e => setTxt(e.target.value)} aria-label="Nuevo libro" />
          <button className="iconbtn" style={{ width: 48, height: 48, flex: 'none', background: 'var(--lime)', color: 'var(--lime-ink)' }} aria-label="Agregar"><Plus /></button>
        </form>
      </section>
    </>
  )
}

