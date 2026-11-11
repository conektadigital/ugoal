import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Check, Copy, MoreHorizontal, Plus, Share2, Star, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { back, go } from '../router'
import { CAT } from '../data/categories'
import type { Contribution, Goal } from '../types'
import { freqWord, groupSaved, isMoney, metricNow, myPrice, mySaved, pace, planWeek, progress, saved } from '../lib/calc'
import { DAY, daysUntil, fDate, fShort, iso, money, num, parse, today, toNum, typed, uid } from '../lib/format'
import { AFTER_WORKOUT, BEHIND, pick } from '../lib/phrases'
import { Bar, CountUp, Photo, Ring, Sheet, burst, toast } from '../components/ui'
import { Celebration, ContributionSheet, shareGoal } from '../components/goal'
import { fileToDataUrl } from './NewGoal'
import { BizBlock, DebtBlock, SchoolNext } from './blocks2'
import { CreditCard, EmergencyUse, FixedDateCard, LetterCard, SimBlock, StudyBlock, ViceBlock } from './blocks'

export default function GoalDetail({ id }: { id?: string }) {
  const { goals, updateGoal } = useStore()
  const g = goals.find(x => x.id === id)
  const [aporte, setAporte] = useState(false)
  const [edit, setEdit] = useState<Contribution | undefined>()
  const [menu, setMenu] = useState(false)
  const [celebrate, setCelebrate] = useState<Goal | null>(null)
  if (!g) return <div className="screen"><div className="topbar"><button className="iconbtn" onClick={() => go('/')} aria-label="Inicio"><ArrowLeft /></button></div><p className="empty">Esta meta ya no existe.</p></div>

  const pr = progress(g)
  const completed = () => setCelebrate(useStore.getState().goals.find(x => x.id === g.id) ?? null)
  const check = (fn: (x: Goal) => void, msg?: string) => {
    const before = !!g.completedAt
    updateGoal(g.id, fn)
    const after = useStore.getState().goals.find(x => x.id === g.id)
    if (!before && after?.completedAt) completed()
    else if (msg) toast(msg)
  }

  return (
    <div className="screen" style={{ gap: 22 }}>
      <div style={{ position: 'relative', margin: '0 -20px' }}>
        <Photo src={g.photo} mode={g.photoMode} ratio={g.photoMode === 'cut' ? '1/0.92' : '1/1.05'} layoutId={`photo-${g.id}`} style={{ borderRadius: 0 }} reveal={g.completedAt ? 1 : pr} />
        <div style={{ position: 'absolute', top: 8, left: 20, right: 20, display: 'flex', justifyContent: 'space-between' }}>
          <button className="iconbtn" style={{ background: 'var(--glass)', backdropFilter: 'blur(14px)' }} onClick={() => back('/')} aria-label="Regresar"><ArrowLeft /></button>
          <button className="iconbtn" style={{ background: 'var(--glass)', backdropFilter: 'blur(14px)' }} onClick={() => setMenu(true)} aria-label="Opciones"><MoreHorizontal /></button>
        </div>
      </div>

      <section className="col" style={{ gap: 8, marginTop: g.photoMode === 'full' ? -90 : -10, position: 'relative' }}>
        <p className="t-xs">{CAT[g.cat].label}{g.forWhom ? ` · para ${g.forWhom}` : ''}{g.group ? (g.flex ? ' · Lo que pueda cada quien' : ' · En grupo') : ''}{g.completedAt ? ' · Cumplida' : ''}</p>
        <h1 className="t-xl">{g.title}</h1>
        {g.why && <p className="t-body">“{g.why}”</p>}
      </section>

      {isMoney(g) ? <MoneyBlock g={g} onAporte={() => { setEdit(undefined); setAporte(true) }} />
        : g.kind === 'plan' ? <PlanBlock g={g} check={check} />
        : g.kind === 'vicio' ? <ViceBlock g={g} check={check} />
        : g.kind === 'estudio' ? <StudyBlock g={g} check={check} />
        : <HabitBlock g={g} check={check} />}

      {isMoney(g) && <FixedDateCard g={g} />}
      {isMoney(g) && !g.completedAt && <SimBlock g={g} />}
      {g.credit && <CreditCard g={g} />}
      <LetterCard g={g} />

      {g.parts && g.parts.length > 0 && <TripBlock g={g} />}
      {g.debts && g.debts.length > 0 && <DebtBlock g={g} />}
      {g.biz && <BizBlock g={g} />}
      <SchoolNext g={g} />
      {g.group && <GroupBlock g={g} />}

      {isMoney(g) && (
        <section className="col" style={{ gap: 4 }}>
          <div className="row"><h2 className="t-md">Historial</h2><span className="t-sm">Toca para editar</span></div>
          {g.contributions.length ? (
            <div className="list">
              {[...g.contributions].sort((a, b) => b.date.localeCompare(a.date)).map(c => (
                <button key={c.id} className="li" onClick={() => { setEdit(c); setAporte(true) }}>
                  <span className="col" style={{ flex: 1, gap: 2 }}><b>{c.note || 'Aporte'}</b><span className="t-sm">{fShort(c.date)}{c.partId && g.parts ? ` · ${g.parts.find(p => p.id === c.partId)?.name ?? ''}` : ''}</span></span>
                  {c.amount < 0 ? <b style={{ color: 'var(--warn)' }}>−{money(-c.amount)}</b> : <b className="lime">+{money(c.amount)}</b>}
                </button>
              ))}
            </div>
          ) : <p className="t-sm" style={{ padding: '12px 0' }}>Todavía no apartas nada. El primer paso es el que más cuesta.</p>}
        </section>
      )}

      <ContributionSheet goal={g} open={aporte} edit={edit} onClose={() => setAporte(false)} onCompleted={completed} />
      <GoalMenu g={g} open={menu} onClose={() => setMenu(false)} pr={pr} />
      <Celebration goal={celebrate} onClose={() => setCelebrate(null)} />
    </div>
  )
}

function MoneyBlock({ g, onAporte }: { g: Goal; onAporte: () => void }) {
  const { profile } = useStore()
  const p = pace(g, profile.pay)
  const left = Math.max(0, myPrice(g) - saved(g))
  return (
    <section className="col" style={{ gap: 16 }}>
      <div className="row" style={{ gap: 18 }}>
        <Ring value={progress(g)} size={124} stroke={12}>
          <span className="col" style={{ gap: 0, alignItems: 'center' }}><span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.045em' }}><CountUp value={Math.round(progress(g) * 100)} format={n => `${Math.round(n)}%`} /></span></span>
        </Ring>
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <span className="t-sm">{g.cat === 'deudas' ? 'Has pagado' : g.flex ? 'Entre todos llevan' : g.group ? 'Tu parte: llevas' : 'Llevas'}</span>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.045em' }}><CountUp value={saved(g)} format={money} /></span>
          <span className="t-sm">{g.cat === 'deudas' ? 'Debes' : 'Faltan'} <b style={{ color: 'var(--ink)' }}>{money(left)}</b> de {money(myPrice(g))}</span>
        </div>
      </div>
      {!g.completedAt && (
        <div className="card" style={{ gap: 6 }}>
          <span className="t-xs">Cada {freqWord(profile.pay)}{profile.pay === 'variable' ? ' · júntalo como puedas' : ''}</span>
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.04em' }} className="lime">{money(p.per)}</span>
          <span className="t-sm">{p.periods} pagos hasta el {fDate(g.due)} · {daysUntil(g.due)} días</span>
          {p.behind && <span style={{ color: 'var(--warn)', fontWeight: 600, fontSize: 14, marginTop: 6 }}>{pick(BEHIND)} Aparta {money(p.catchUp)} en tu próximo pago.</span>}
          {!p.behind && saved(g) > 0 && <span style={{ color: 'var(--lime-text)', fontWeight: 600, fontSize: 14, marginTop: 6 }}>Vas al ritmo. Sigue así.</span>}
        </div>
      )}
      {!g.completedAt && <button className="btn" onClick={onAporte}><Plus /> {g.cat === 'deudas' ? 'Hice un pago' : 'Aparté'}</button>}
      {g.emergency && saved(g) > 0 && <EmergencyUse g={g} />}
    </section>
  )
}

function TripBlock({ g }: { g: Goal }) {
  const { updateGoal } = useStore()
  const [txt, setTxt] = useState('')
  const per = (pid: string) => g.contributions.filter(c => c.partId === pid).reduce((s, c) => s + c.amount, 0)
  const div = g.group ? g.group.members.length : 1
  return (
    <>
      {g.parts && g.parts.length > 0 && (
        <section className="col" style={{ gap: 6 }}>
          <h2 className="t-md">{g.kind === 'viaje' ? 'Desglose del viaje' : 'Desglose'}</h2>
          <div className="card" style={{ gap: 14 }}>
            {g.parts.map(p => (
              <div key={p.id} className="col" style={{ gap: 7 }}>
                <div className="row"><span style={{ fontSize: 15 }}>{p.name}</span><span className="t-sm"><b style={{ color: 'var(--ink)' }}>{money(per(p.id))}</b> / {money(p.amount / div)}</span></div>
                <Bar value={per(p.id) / (p.amount / div)} />
              </div>
            ))}
          </div>
        </section>
      )}
      {g.checklist && <section className="col" style={{ gap: 4 }}>
        <div className="row"><h2 className="t-md">{g.kind === 'viaje' ? 'Pendientes del viaje' : 'Pendientes'}</h2><span className="t-sm">{g.checklist?.filter(c => c.done).length ?? 0} de {g.checklist?.length ?? 0}</span></div>
        <div className="list">
          {g.checklist?.map(c => (
            <div key={c.id} className="li">
              <motion.button whileTap={{ scale: 0.85 }} className={`check ${c.done ? 'on' : ''}`} aria-pressed={c.done} aria-label={c.text}
                onClick={() => { updateGoal(g.id, x => { const it = x.checklist!.find(y => y.id === c.id)!; it.done = !it.done }); if (!c.done) toast('Uno menos.') }}>{c.done && <Check />}</motion.button>
              <span style={{ flex: 1, color: c.done ? 'var(--muted)' : 'var(--ink)', textDecoration: c.done ? 'line-through' : 'none' }}>{c.text}</span>
              {c.date && <span className="t-sm">{fShort(c.date)}</span>}
              <button aria-label="Quitar" onClick={() => updateGoal(g.id, x => { x.checklist = x.checklist!.filter(y => y.id !== c.id) })} style={{ color: 'var(--muted)' }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <form style={{ display: 'flex', gap: 8, marginTop: 6 }} onSubmit={e => { e.preventDefault(); if (!txt.trim()) return; updateGoal(g.id, x => { x.checklist = [...(x.checklist ?? []), { id: uid(), text: txt.trim(), done: false }] }); setTxt('') }}>
          <input className="input" style={{ height: 48 }} placeholder="Agregar pendiente" value={txt} onChange={e => setTxt(e.target.value)} aria-label="Nuevo pendiente" />
          <button className="iconbtn" style={{ width: 48, height: 48, flex: 'none', background: 'var(--lime)', color: 'var(--lime-ink)' }} aria-label="Agregar"><Plus /></button>
        </form>
      </section>}
    </>
  )
}

function GroupBlock({ g }: { g: Goal }) {
  const { updateGoal } = useStore()
  const [pay, setPay] = useState<{ id: string; v: string } | null>(null)
  const share = g.flex ? 0 : g.price / g.group!.members.length
  const tot = groupSaved(g)
  const copy = async () => { try { await navigator.clipboard.writeText(g.group!.code); toast('Código copiado') } catch { toast(`Tu código: ${g.group!.code}`) } }
  return (
    <section className="col" style={{ gap: 8 }}>
      <div className="row"><h2 className="t-md">El grupo</h2><button className="chip" onClick={copy}><Copy /> {g.group!.code}</button></div>
      <div className="card" style={{ gap: 4 }}>
        <div className="row"><span className="t-sm">Entre todos</span><b>{money(tot)} de {money(g.price)}</b></div>
        <Bar value={tot / g.price} />
        <div className="list" style={{ marginTop: 6 }}>
          {g.group!.members.map(m => {
            const paid = m.isMe ? mySaved(g) : m.paid, pc = g.flex ? (tot ? paid / tot : 0) : Math.min(1, paid / share)
            return (
              <div key={m.id} className="li" style={{ alignItems: 'center' }}>
                <span style={{ width: 38, height: 38, borderRadius: '50%', background: m.isMe ? 'var(--lime)' : 'var(--card-2)', color: m.isMe ? 'var(--lime-ink)' : 'var(--ink)', display: 'grid', placeItems: 'center', fontWeight: 700, flex: 'none' }}>{m.name[0]?.toUpperCase()}</span>
                <span className="col" style={{ flex: 1, gap: 6 }}>
                  <span className="row"><b>{m.isMe ? 'Tú' : m.name}</b><span className="t-sm">{g.flex ? (m.show === 'monto' || m.isMe ? `${money(paid)} · ${Math.round(pc * 100)}% del total` : `${Math.round(pc * 100)}% del total`) : m.show === 'monto' || m.isMe ? `${money(paid)} / ${money(share)}` : `${Math.round(pc * 100)}%`}</span></span>
                  <Bar value={pc} />
                </span>
                {!m.isMe && <button className="chip" style={{ flex: 'none' }} onClick={() => setPay({ id: m.id, v: '' })} aria-label={`Registrar pago de ${m.name}`}><Plus /></button>}
              </div>
            )
          })}
        </div>
      </div>
      <label className="li" style={{ justifyContent: 'space-between' }}>
        <span className="col" style={{ gap: 0 }}><b>Mostrar mi monto al grupo</b><span className="t-sm">Si lo apagas, solo ven tu porcentaje</span></span>
        <input type="checkbox" className="switch" checked={g.group!.members.find(m => m.isMe)?.show === 'monto'} onChange={e => updateGoal(g.id, x => { x.group!.members.find(m => m.isMe)!.show = e.target.checked ? 'monto' : 'pct' })} />
      </label>
      <p className="t-sm">Por ahora tú registras lo que pone cada quien. Cuando conectes tu cuenta, cada persona lo registra desde su celular con el código.</p>
      <Sheet open={!!pay} onClose={() => setPay(null)}>
        {pay && (
          <>
            <h2 className="t-lg">¿Cuánto puso {g.group!.members.find(m => m.id === pay.id)?.name}?</h2>
            <label className="money-input"><span>$</span><input inputMode="decimal" placeholder="0" autoFocus value={pay.v} onChange={e => setPay({ ...pay, v: typed(e.target.value) })} aria-label="Monto" /></label>
            <button className="btn" onClick={() => { const v = toNum(pay.v); if (!(v > 0)) return; updateGoal(g.id, x => { x.group!.members.find(m => m.id === pay.id)!.paid += v }); setPay(null); toast('Registrado') }}>Guardar</button>
          </>
        )}
      </Sheet>
    </section>
  )
}

function PlanBlock({ g, check }: { g: Goal; check: (fn: (x: Goal) => void, msg?: string) => void }) {
  const [metric, setMetric] = useState(false)
  const [val, setVal] = useState('')
  const w = planWeek(g), plan = g.plan!
  const week = plan.weeks[w - 1]
  const upload = async (f?: File) => { if (!f) return; const src = await fileToDataUrl(f, 900); check(x => { x.progressPhotos = [...(x.progressPhotos ?? []), { date: iso(today()), src }] }, 'Foto guardada. Solo tú la ves.') }
  return (
    <>
      <section className="row" style={{ gap: 18 }}>
        <Ring value={progress(g)} size={124} stroke={12}><span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.045em' }}>{Math.round(progress(g) * 100)}%</span></Ring>
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <span className="t-sm">{plan.label}</span>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.045em' }}>{num(metricNow(g))} <span style={{ fontSize: 16, color: 'var(--muted)' }}>{plan.unit}</span></span>
          <span className="t-sm">Meta: <b style={{ color: 'var(--ink)' }}>{num(plan.target)} {plan.unit}</b> · {fShort(g.due)}</span>
        </div>
      </section>
      <button className="btn" onClick={() => { setVal(''); setMetric(true) }}><Plus /> Registrar mi marca</button>

      <section className="col" style={{ gap: 12 }}>
        <div className="row"><h2 className="t-md">Semana {w} de {plan.weeks.length}</h2><span className="t-sm">{week.filter(s => s.done).length}/{week.length} hechos</span></div>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {plan.weeks.map((wk, i) => {
            const full = wk.every(s => s.done), now = i + 1 === w
            return <span key={i} style={{ flex: 'none', width: 40, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 15, background: now ? 'var(--lime)' : full ? 'var(--lime-soft)' : 'var(--card)', color: now ? 'var(--lime-ink)' : full ? 'var(--lime-text)' : 'var(--muted)', border: '1px solid var(--line)' }}>{i + 1}</span>
          })}
        </div>
        <div className="list">
          {week.map((s, k) => (
            <div key={k} className="li">
              <motion.button whileTap={{ scale: 0.85 }} className={`check ${s.done ? 'on' : ''}`} aria-pressed={s.done} aria-label={s.t}
                onClick={() => { check(x => { x.plan!.weeks[w - 1][k].done = !s.done }, s.done ? undefined : pick(AFTER_WORKOUT)); if (!s.done) burst(30) }}>{s.done && <Check />}</motion.button>
              <span style={{ flex: 1, color: s.done ? 'var(--muted)' : 'var(--ink)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.t}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="col" style={{ gap: 10 }}><h2 className="t-md">Tu avance contra el plan</h2><PlanChart g={g} /></section>

      <section className="col" style={{ gap: 10 }}>
        <div className="row"><h2 className="t-md">Antes y después</h2><span className="t-sm">Solo tú las ves</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {[g.progressPhotos?.[0], g.progressPhotos && g.progressPhotos.length > 1 ? g.progressPhotos[g.progressPhotos.length - 1] : undefined].map((p, i) => (
            <label key={i} className="photo" style={{ aspectRatio: '3/4', display: 'grid', placeItems: 'center', border: p ? 0 : '1.5px dashed var(--line-2)', background: p ? 'var(--card)' : 'transparent', cursor: 'pointer' }}>
              {p ? <><img src={p.src} alt={i ? 'Después' : 'Antes'} /><span className="chip" style={{ position: 'absolute', left: 8, bottom: 8 }}>{i ? 'Hoy' : 'Inicio'} · {fShort(p.date)}</span></>
                : <span className="col" style={{ alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}><Camera />{i ? 'Foto de hoy' : 'Foto de inicio'}</span>}
              <input type="file" accept="image/*" hidden onChange={e => upload(e.target.files?.[0])} />
            </label>
          ))}
        </div>
      </section>

      <Sheet open={metric} onClose={() => setMetric(false)}>
        <h2 className="t-lg">Nueva marca</h2>
        <p className="t-sm">{plan.label} · tu mejor marca: {num(metricNow(g))} {plan.unit}</p>
        <label className="money-input"><input inputMode="decimal" placeholder="0" autoFocus value={val} onChange={e => setVal(e.target.value.replace(/[^0-9.]/g, ''))} aria-label="Marca" /><span style={{ fontSize: 22 }}>{plan.unit}</span></label>
        <button className="btn" onClick={() => { const v = parseFloat(val); if (!(v >= 0)) return; setMetric(false); check(x => { x.metrics = [...(x.metrics ?? []), { date: iso(today()), value: v }] }, (plan.target < plan.base ? v < metricNow(g) : v > metricNow(g)) ? 'Nueva mejor marca. Eso es progreso.' : 'Registrado. Mañana más.') }}>Guardar</button>
      </Sheet>
    </>
  )
}

function PlanChart({ g }: { g: Goal }) {
  const plan = g.plan!, W = 340, H = 170, l = 34, r = 14, t = 16, b = 26
  const n = plan.weeks.length, start = parse(g.start).getTime()
  const pts = (g.metrics ?? []).map(m => ({ w: Math.min(n, 1 + (parse(m.date).getTime() - start) / DAY / 7), v: m.value }))
  const maxV = Math.max(plan.target, ...pts.map(p => p.v)) * 1.08, minV = Math.min(plan.base, ...pts.map(p => p.v), 0)
  const x = (w: number) => l + ((w - 1) / Math.max(1, n - 1)) * (W - l - r)
  const y = (v: number) => t + (1 - (v - minV) / (maxV - minV || 1)) * (H - t - b)
  const ticks = [minV, (minV + plan.target) / 2, plan.target]
  const last = pts[pts.length - 1]
  return (
    <div className="card" style={{ padding: '14px 10px 10px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Tu marca por semana contra el plan">
        {ticks.map((v, i) => <g key={i}><line x1={l} x2={W - r} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={l - 6} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)">{num(v)}</text></g>)}
        {[1, Math.ceil(n / 2), n].map(w => <text key={w} x={x(w)} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--muted)">Sem {w}</text>)}
        <line x1={x(1)} y1={y(plan.base)} x2={x(n)} y2={y(plan.target)} stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 5" />
        {pts.length > 1 && <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} points={pts.map(p => `${x(p.w)},${y(p.v)}`).join(' ')} fill="none" stroke="var(--lime-mark)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
        {last && <><circle cx={x(last.w)} cy={y(last.v)} r="6" fill="var(--lime-mark)" stroke="var(--card)" strokeWidth="2.5" /><text x={x(last.w)} y={y(last.v) - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">{num(last.v)}</text></>}
      </svg>
      <div className="row" style={{ justifyContent: 'flex-start', gap: 16, padding: '4px 6px 0' }}>
        <span className="t-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 14, height: 3, background: 'var(--lime)', borderRadius: 2 }} />Tu marca</span>
        <span className="t-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 14, borderTop: '2px dashed var(--muted)' }} />Plan</span>
      </div>
    </div>
  )
}

function HabitBlock({ g, check }: { g: Goal; check: (fn: (x: Goal) => void, msg?: string) => void }) {
  const h = g.habit!, t = iso(today()), done = h.checks.includes(t)
  const days = Array.from({ length: h.days }, (_, i) => iso(new Date(parse(g.start).getTime() + i * DAY)))
  return (
    <>
      <section className="row" style={{ gap: 18 }}>
        <Ring value={progress(g)} size={124} stroke={12}><span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.045em' }}>{h.checks.length}<span style={{ fontSize: 15, color: 'var(--muted)' }}>/{h.days}</span></span></Ring>
        <div className="col" style={{ flex: 1, gap: 4 }}><span className="t-sm">Días cumplidos</span><span className="t-md">Termina el {fShort(g.due)}</span></div>
      </section>
      <button className="btn" disabled={done} onClick={() => { check(x => { x.habit!.checks.push(t) }, pick(AFTER_WORKOUT)); burst(40) }}>{done ? 'Hoy ya cumpliste' : <><Check /> Hoy cumplí</>}</button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
        {days.map((d, i) => (
          <motion.span key={d} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.012 }} title={fShort(d)}
            style={{ aspectRatio: '1', borderRadius: 8, background: h.checks.includes(d) ? 'var(--lime)' : d === t ? 'var(--card-2)' : 'var(--card)', border: d === t ? '1.5px solid var(--lime)' : '1px solid var(--line)' }} />
        ))}
      </div>
    </>
  )
}

function GoalMenu({ g, open, onClose, pr }: { g: Goal; open: boolean; onClose: () => void; pr: number }) {
  const { updateGoal, removeGoal, setMain, mainId } = useStore()
  const [mode, setMode] = useState<'menu' | 'edit' | 'del'>('menu')
  const [title, setTitle] = useState(g.title), [price, setPrice] = useState(typed(String(g.price))), [due, setDue] = useState(g.due), [why, setWhy] = useState(g.why ?? '')
  const close = () => { setMode('menu'); onClose() }
  const photo = async (f?: File) => { if (!f) return; const src = await fileToDataUrl(f); updateGoal(g.id, x => { x.photo = src; x.photoMode = 'full' }); toast('Foto actualizada'); close() }
  return (
    <Sheet open={open} onClose={close}>
      {mode === 'menu' && (
        <div className="list">
          <button className="li" onClick={() => { setTitle(g.title); setPrice(typed(String(g.price))); setDue(g.due); setWhy(g.why ?? ''); setMode('edit') }}><b style={{ flex: 1 }}>Editar meta</b></button>
          {mainId !== g.id && !g.completedAt && <button className="li" onClick={() => { setMain(g.id); toast('Ahora es tu meta principal'); close() }}><Star size={18} /><b style={{ flex: 1 }}>Hacerla mi meta principal</b></button>}
          <button className="li" onClick={() => { shareGoal(g, pr); close() }}><Share2 size={18} /><b style={{ flex: 1 }}>Historia para Instagram</b></button>
          <label className="li" style={{ cursor: 'pointer' }}><Camera size={18} /><b style={{ flex: 1 }}>Cambiar foto</b><input type="file" accept="image/*" hidden onChange={e => photo(e.target.files?.[0])} /></label>
          {g.group && <div className="li"><Users size={18} /><span style={{ flex: 1 }}>Código del grupo: <b>{g.group.code}</b></span></div>}
          <button className="li" style={{ color: 'var(--danger)' }} onClick={() => setMode('del')}><Trash2 size={18} /><b style={{ flex: 1 }}>Borrar meta</b></button>
        </div>
      )}
      {mode === 'edit' && (
        <>
          <h2 className="t-lg">Editar meta</h2>
          <div className="field"><label className="label" htmlFor="e-t">Nombre</label><input id="e-t" className="input" value={title} onChange={e => setTitle(e.target.value)} /></div>
          {isMoney(g) && g.kind !== 'viaje' && <div className="field"><label className="label" htmlFor="e-p">Precio</label><input id="e-p" className="input" inputMode="decimal" value={price} onChange={e => setPrice(typed(e.target.value))} /></div>}
          {isMoney(g) && <div className="field"><label className="label" htmlFor="e-d">Fecha meta</label><input id="e-d" className="input" type="date" value={due} onChange={e => e.target.value && setDue(e.target.value)} /></div>}
          <div className="field"><label className="label" htmlFor="e-w">¿Por qué la quieres?</label><textarea id="e-w" className="input" value={why} onChange={e => setWhy(e.target.value)} /></div>
          <button className="btn" onClick={() => { updateGoal(g.id, x => { x.title = title.trim() || x.title; if (isMoney(x) && x.kind !== 'viaje') x.price = toNum(price) || x.price; x.due = due; x.why = why.trim() || undefined }); toast('Cambios guardados'); close() }}>Guardar cambios</button>
        </>
      )}
      {mode === 'del' && (
        <>
          <h2 className="t-lg">¿Borrar “{g.title}”?</h2>
          <p className="t-body">Se borran también sus aportes y su historial. No se puede deshacer.</p>
          <button className="btn danger" onClick={() => { removeGoal(g.id); close(); go('/', { replace: true }); toast('Meta borrada') }}>Sí, borrar</button>
          <button className="btn ghost" onClick={() => setMode('menu')}>Cancelar</button>
        </>
      )}
    </Sheet>
  )
}
