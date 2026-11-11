import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { back, go } from '../router'
import type { Goal, Reto, Tanda } from '../types'
import { cleanDays, isMoney, mySaved, streak, studyHours } from '../lib/calc'
import { art } from '../data/categories'
import { def } from './Retos'

export interface Badge { id: string; name: string; how: string; icon: string; test: (s: { goals: Goal[]; retos: Reto[]; tandas: Tanda[] }) => boolean }

const total = (goals: Goal[]) => goals.filter(isMoney).reduce((s, g) => s + mySaved(g), 0)
const sessions = (goals: Goal[]) => goals.reduce((s, g) => s + (g.plan?.weeks.flat().filter(x => x.done).length ?? 0) + (g.habit?.checks.length ?? 0), 0)

export const BADGES: Badge[] = [
  { id: 'primera-meta', name: 'Primer sueño', how: 'Crea tu primera meta', icon: 'seedling', test: s => s.goals.length > 0 },
  { id: 'primer-aporte', name: 'Primer peso', how: 'Registra tu primer aporte', icon: 'piggy', test: s => s.goals.some(g => g.contributions.some(c => c.amount > 0)) },
  { id: 'carta', name: 'Carta al futuro', how: 'Escríbele a tu yo del futuro', icon: 'envelope', test: s => s.goals.some(g => !!g.letter) },
  { id: 'racha-4', name: 'Constante', how: '4 semanas seguidas', icon: 'fire', test: s => streak(s.goals) >= 4 },
  { id: 'racha-12', name: 'Imparable', how: '12 semanas seguidas', icon: 'rocket', test: s => streak(s.goals) >= 12 },
  { id: 'ahorro-10k', name: '$10,000 apartados', how: 'Junta $10,000 entre tus metas', icon: 'gem', test: s => total(s.goals) >= 10000 },
  { id: 'ahorro-100k', name: '$100,000 apartados', how: 'Junta $100,000 entre tus metas', icon: 'bank', test: s => total(s.goals) >= 100000 },
  { id: 'cumplida-1', name: 'Lo lograste', how: 'Cumple tu primera meta', icon: 'trophy', test: s => s.goals.some(g => g.completedAt) },
  { id: 'cumplida-5', name: 'Leyenda', how: 'Cumple 5 metas', icon: 'crown', test: s => s.goals.filter(g => g.completedAt).length >= 5 },
  { id: 'fondo', name: 'Colchón listo', how: 'Completa tu fondo de emergencia', icon: 'umbrella', test: s => s.goals.some(g => g.emergency && g.completedAt) },
  { id: 'deuda', name: 'Libre de deuda', how: 'Liquida una deuda', icon: 'key', test: s => s.goals.some(g => g.cat === 'deudas' && g.completedAt) },
  { id: 'vicio-7', name: 'Una semana limpio', how: '7 días sin tu vicio', icon: 'shield', test: s => s.goals.some(g => g.vice?.mode === 'dejar' && Math.max(cleanDays(g), g.vice.best) >= 7) },
  { id: 'vicio-30', name: 'Un mes limpio', how: '30 días sin tu vicio', icon: 'star', test: s => s.goals.some(g => g.vice?.mode === 'dejar' && Math.max(cleanDays(g), g.vice.best) >= 30) },
  { id: 'estudio-10', name: 'Mente enfocada', how: '10 horas de estudio', icon: 'brain', test: s => s.goals.some(g => studyHours(g) >= 10) },
  { id: 'fisico-10', name: 'En movimiento', how: '10 entrenamientos o días de hábito', icon: 'muscle', test: s => sessions(s.goals) >= 10 },
  { id: 'reto', name: 'Reto cumplido', how: 'Termina un reto de ahorro', icon: 'medal', test: s => s.retos.some(r => Object.keys(r.marks).length >= def(r).steps) },
  { id: 'tanda', name: 'Palabra de honor', how: 'Arma una tanda', icon: 'handshake', test: s => s.tandas.length > 0 },
  { id: 'negocio', name: 'Emprendedor', how: 'Abre tu negocio', icon: 'chart', test: s => s.goals.some(g => g.biz?.open) },
  { id: 'pareja', name: 'En equipo', how: 'Crea una meta en grupo o en pareja', icon: 'couple', test: s => s.goals.some(g => !!g.group) },
]
export const earned = (s: { goals: Goal[]; retos: Reto[]; tandas: Tanda[] }) => BADGES.filter(b => b.test(s)).map(b => b.id)

export function BadgeStrip() {
  const { goals, retos, tandas } = useStore()
  const got = earned({ goals, retos, tandas })
  const show = BADGES.filter(b => got.includes(b.id)).slice(-4)
  return (
    <motion.button type="button" className="card" onClick={() => go('/insignias')} whileTap={{ scale: 0.98 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, textAlign: 'left' }}>
      <div style={{ display: 'flex' }}>
        {(show.length ? show : BADGES.slice(0, 3)).map((b, i) => (
          <img key={b.id} src={art(`b-${b.id}`)} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', marginLeft: i ? -10 : 0, border: '2px solid var(--bg)', filter: show.length ? undefined : 'grayscale(1) brightness(.5)' }} />
        ))}
      </div>
      <span className="col" style={{ flex: 1, gap: 0 }}><b>Insignias</b><span className="t-sm">{got.length} de {BADGES.length} desbloqueadas</span></span>
      <ChevronRight size={18} color="var(--muted)" />
    </motion.button>
  )
}

export default function Badges() {
  const { goals, retos, tandas } = useStore()
  const got = earned({ goals, retos, tandas })
  return (
    <div className="screen" style={{ gap: 18 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back('/')} aria-label="Regresar"><ArrowLeft /></button><span /></div>
      <div className="col" style={{ gap: 6 }}><h1 className="t-xl">Insignias</h1><p className="t-body">{got.length} de {BADGES.length}. Cada una se gana haciendo, no pagando.</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {BADGES.map((b, i) => {
          const on = got.includes(b.id)
          return (
            <motion.div key={b.id} className={`badge glass ${on ? '' : 'locked'}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 20 }}>
              <motion.img src={art(`b-${b.id}`)} alt="" animate={on ? { scale: [1, 1.05, 1] } : undefined} transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }} />
              <b>{b.name}</b>
              <span className="t-sm" style={{ fontSize: 11 }}>{b.how}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
