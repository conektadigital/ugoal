import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { BarChart3, CalendarDays, Coffee, Flame, Plus, Split, Target, Users } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { go } from '../router'
import { cleanDays, isMoney, myPrice, pace, progress, saved, streak, studyHours, viceLimit } from '../lib/calc'
import { fMonth, iso, money, num } from '../lib/format'
import { BEHIND, dailySeed, pick } from '../lib/phrases'
import { dailyMessage } from '../lib/messages'
import { CAT, catArt } from '../data/categories'
import type { Goal } from '../types'
import { CountUp, Logo, Photo, Press, Ring } from '../components/ui'
import { Celebration, ContributionSheet } from '../components/goal'
import { QuickSheet, SplitSheet } from '../components/tools'
import { CategoryGrid } from './NewGoal'
import { BadgeStrip } from './Badges'
import { InstallCard } from '../components/Install'

export function subline(g: Goal) {
  if (isMoney(g)) return `${money(saved(g))} de ${money(myPrice(g))}`
  if (g.kind === 'plan') return g.plan!.label
  if (g.kind === 'vicio' && g.vice) return g.vice.mode === 'dejar' ? `${cleanDays(g)} ${cleanDays(g) === 1 ? 'día' : 'días'} limpio` : `Límite de hoy: ${viceLimit(g)} ${g.vice.unit}`
  if (g.kind === 'estudio' && g.study) {
    const s = g.study
    if (s.mode === 'horas') return `${num(studyHours(g))} de ${s.target} horas`
    if (s.mode === 'examen') return `${s.topics?.filter(t => t.done).length ?? 0} de ${s.topics?.length ?? 0} temas`
    return `${s.books?.filter(b => b.done).length ?? 0} de ${s.target} libros`
  }
  return g.habit ? `${g.habit.checks.length} de ${g.habit.days} días` : ''
}

const PEEK = 62

/** Metas apiladas como tarjetas de Wallet: la de enfrente se ve completa; toca una de atrás para traerla al frente
 *  o desliza la de enfrente hacia abajo para mandarla atrás. */
function Wallet({ goals, front, setFront }: { goals: Goal[]; front: string; setFront: (id: string) => void }) {
  const order = [...goals.filter(g => g.id !== front), goals.find(g => g.id === front)!].filter(Boolean)
  const H = 300
  const height = H + (order.length - 1) * PEEK
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (order.length > 1 && (info.offset.y > 70 || info.velocity.y > 500)) setFront(order[order.length - 2].id)
  }
  return (
    <div className="wallet" style={{ height }}>
      {order.map((g, i) => {
        const isFront = i === order.length - 1
        const pr = progress(g)
        return (
          <motion.div key={g.id} className="wallet-card" layout
            initial={false}
            animate={{ top: i * PEEK, scale: isFront ? 1 : 0.94 + (i / Math.max(1, order.length)) * 0.05, height: H, zIndex: i }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            drag={isFront ? 'y' : false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.05, bottom: 0.5 }} onDragEnd={isFront ? onDragEnd : undefined}
            onClick={() => (isFront ? go(`/meta/${g.id}`) : setFront(g.id))}
            whileTap={{ scale: isFront ? 0.985 : 0.95 }}
            style={{ background: 'var(--card)' }}>
            <Photo src={g.photo} mode={g.photoMode} ratio="auto" style={{ height: '100%', aspectRatio: 'auto' }} layoutId={isFront ? `photo-${g.id}` : undefined} reveal={pr} shade={false} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: '14px 18px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: 'linear-gradient(180deg, rgba(7,8,10,.82), transparent)', color: '#F4F6F1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <b style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</b>
              </span>
              <b style={{ color: '#C6FF3D', fontSize: 16, flex: 'none' }}>{Math.round(pr * 100)}%</b>
            </div>
            {isFront && (
              <div className="wallet-meta">
                <span className="col" style={{ gap: 2 }}>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>{CAT[g.cat].short} · {fMonth(g.due)}</span>
                  <b style={{ fontSize: 15 }}>{subline(g)}</b>
                </span>
                {order.length > 1 && <span style={{ fontSize: 11.5, opacity: 0.6 }}>Desliza ↓</span>}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const { profile, goals, mainId } = useStore()
  const [open, setOpen] = useState(false)
  const [split, setSplit] = useState(false)
  const [quick, setQuick] = useState(false)
  const [celebrate, setCelebrate] = useState<Goal | null>(null)
  const active = goals.filter(g => !g.completedAt)
  const [frontId, setFrontId] = useState<string | undefined>()
  const main = active.find(g => g.id === frontId) ?? active.find(g => g.id === mainId) ?? active[0]
  const done = goals.filter(g => g.completedAt)
  const st = streak(goals)
  const p = main && isMoney(main) ? pace(main, profile.pay) : null
  const moneyActive = active.filter(isMoney)
  const hasFund = goals.some(g => g.emergency)
  const day = new Date().getDate()
  const prev = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
  const lastMonth = prev.toLocaleDateString('es-MX', { month: 'long' })
  const prevKey = iso(prev).slice(0, 7)
  const hadLast = goals.some(g => g.contributions.some(c => c.date.startsWith(prevKey)))
  const msg = dailyMessage(profile, goals)
  const tools = [
    moneyActive.length > 1 && { k: 'split', t: 'Repartir', s: 'entre mis metas', I: Split, on: () => setSplit(true) },
    moneyActive.length > 0 && { k: 'quick', t: 'No me lo compré', s: 'antojo → meta', I: Coffee, on: () => setQuick(true) },
    { k: 'retos', t: 'Retos', s: 'con monto, 52 semanas…', I: Target, on: () => go('/retos') },
    { k: 'resumen', t: 'Mi avance', s: 'resumen del mes', I: BarChart3, on: () => go('/resumen') },
    { k: 'cal', t: 'Calendario', s: 'pagos y fechas', I: CalendarDays, on: () => go('/calendario') },
    { k: 'grupos', t: 'Tandas y grupos', s: 'con tus amigos', I: Users, on: () => go('/grupos') },
  ].filter(Boolean) as { k: string; t: string; s: string; I: typeof Split; on: () => void }[]

  return (
    <div className="screen">
      <div className="topbar">
        <Logo />
        <button className="iconbtn" onClick={() => go('/perfil')} aria-label="Perfil" style={{ fontWeight: 700 }}>{(profile.name || 'U')[0].toUpperCase()}</button>
      </div>

      <section className="col" style={{ gap: 10 }}>
        <p className="t-sm">Hola, {profile.name || 'tú'}{st > 0 && <> · <span className="lime"><Flame size={13} style={{ verticalAlign: '-2px' }} /> {st} {st === 1 ? 'semana' : 'semanas'} seguidas</span></>}</p>
        <motion.h1 className="t-lg" style={{ fontSize: 26 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>{msg}</motion.h1>
      </section>

      <InstallCard compact />

      {!main && (
        <section className="col" style={{ gap: 16 }}>
          <div className="card" style={{ alignItems: 'flex-start', gap: 12, padding: 22 }}>
            <p className="t-xs lime">Empieza aquí</p>
            <h2 className="t-lg">{goals.length ? 'Cumpliste todo. ¿Qué sigue?' : 'Tu primer sueño te está esperando.'}</h2>
            <p className="t-body">Elige qué quieres, ponle precio y fecha. Nosotros hacemos las cuentas.</p>
            <button className="btn" onClick={() => go('/nueva')}><Plus /> Crear meta</button>
          </div>
          <CategoryGrid onPick={k => go(`/nueva/${k}`)} />
        </section>
      )}

      {main && (
        <section className="col" style={{ gap: 18 }}>
          <Wallet goals={active.slice(0, 6)} front={main.id} setFront={setFrontId} />
          <AnimatePresence mode="wait">
            <motion.div key={main.id} className="col" style={{ gap: 16 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <div className="row" style={{ alignItems: 'center', gap: 18 }}>
                <Ring value={progress(main)} size={108} stroke={11}>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em' }}><CountUp value={Math.round(progress(main) * 100)} format={n => `${Math.round(n)}%`} /></span>
                </Ring>
                <div className="col" style={{ flex: 1, gap: 4 }}>
                  {isMoney(main) ? (
                    <>
                      <span className="t-sm">{main.cat === 'deudas' ? 'Has pagado' : 'Llevas'}</span>
                      <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em' }}><CountUp value={saved(main)} format={money} /></span>
                      <span className="t-sm">{main.cat === 'deudas' ? 'Debes' : 'Faltan'} <b style={{ color: 'var(--ink)' }}>{money(Math.max(0, myPrice(main) - saved(main)))}</b></span>
                    </>
                  ) : (
                    <><span className="t-sm">Tu avance</span><span className="t-md">{subline(main)}</span></>
                  )}
                </div>
              </div>
              {p?.behind && (
                <div className="card" style={{ background: 'var(--warn-soft)', borderColor: 'transparent', padding: 14, gap: 4 }}>
                  <b style={{ color: 'var(--warn)' }}>{pick(BEHIND, dailySeed())}</b>
                  <span className="t-sm" style={{ color: 'var(--ink-2)' }}>Aparta {money(p.catchUp)} en tu próximo pago para regresar al ritmo.</span>
                </div>
              )}
              {isMoney(main)
                ? <button className="btn" onClick={() => setOpen(true)}><Plus /> {main.cat === 'deudas' ? 'Hice un pago' : 'Aparté'}</button>
                : <button className="btn" onClick={() => go(`/meta/${main.id}`)}>{main.kind === 'vicio' ? 'Anotar mi día' : main.kind === 'estudio' ? 'Estudiar ahora' : 'Ver mi plan de hoy'}</button>}
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {goals.length > 0 && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {tools.map((t, i) => (
            <motion.button key={t.k} type="button" className="card" onClick={t.on} whileTap={{ scale: 0.96 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              style={{ padding: 14, gap: 8, alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--lime-soft)', color: 'var(--lime-text)', display: 'grid', placeItems: 'center' }}><t.I size={18} /></span>
              <span className="col" style={{ gap: 0 }}><b style={{ fontSize: 15 }}>{t.t}</b><span className="t-sm" style={{ fontSize: 12.5 }}>{t.s}</span></span>
            </motion.button>
          ))}
        </section>
      )}

      {goals.length > 0 && <BadgeStrip />}

      {day <= 5 && hadLast && (
        <Press onClick={() => go('/resumen/prev')} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, textAlign: 'left', display: 'flex' }}>
          <BarChart3 className="lime" /><span className="col" style={{ flex: 1, gap: 0 }}><b>Tu resumen de {lastMonth} está listo</b><span className="t-sm">Cuánto apartaste y qué tan cerca vas</span></span>
        </Press>
      )}

      {goals.length > 0 && !hasFund && (
        <Press onClick={() => go('/nueva/finanzas/fondo3')} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, textAlign: 'left', display: 'flex' }}>
          <img src={catArt('finanzas')} alt="" style={{ width: 46, height: 46, borderRadius: 14, objectFit: 'cover', flex: 'none' }} />
          <span className="col" style={{ flex: 1, gap: 2 }}><b>Primero, tu colchón</b><span className="t-sm">Un fondo de emergencia de 3 meses de gastos evita que un imprevisto se coma tus metas.</span></span>
        </Press>
      )}

      {active.length > 6 && (
        <section className="col" style={{ gap: 8 }}>
          <h2 className="t-md">Todas mis metas</h2>
          <div className="list">
            {active.slice(6).map(g => (
              <button key={g.id} className="li" onClick={() => go(`/meta/${g.id}`)}>
                <img src={catArt(g.cat)} alt="" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover' }} />
                <span className="col" style={{ flex: 1, gap: 0, textAlign: 'left' }}><b>{g.title}</b><span className="t-sm">{subline(g)}</span></span>
                <b className="lime">{Math.round(progress(g) * 100)}%</b>
              </button>
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section className="col" style={{ gap: 8 }}>
          <h2 className="t-md">Cumplidas</h2>
          <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}>
            {done.map(g => (
              <Press key={g.id} onClick={() => go(`/meta/${g.id}`)} style={{ flex: '0 0 38%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Photo src={g.photo} mode={g.photoMode} ratio="1/1"><span className="chip lime" style={{ position: 'absolute', top: 8, left: 8 }}>Cumplida</span></Photo>
                <b style={{ fontSize: 13 }}>{g.title}</b>
              </Press>
            ))}
          </div>
        </section>
      )}

      <SplitSheet open={split} onClose={() => setSplit(false)} onCompleted={setCelebrate} />
      <QuickSheet open={quick} onClose={() => setQuick(false)} onCompleted={setCelebrate} />
      {main && <ContributionSheet goal={main} open={open} onClose={() => setOpen(false)} onCompleted={() => setCelebrate(useStore.getState().goals.find(g => g.id === main.id) ?? null)} />}
      <Celebration goal={celebrate} onClose={() => setCelebrate(null)} />
    </div>
  )
}
