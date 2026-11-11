import type { Goal, Profile } from '../types'
import { cleanDays, isMoney, pace, progress, saved, streak } from './calc'
import { daysUntil, iso, money, today } from './format'

/* Mensajes con tu nombre y tu meta. Tono coach directo, sin regaños vacíos. */
const DAILY_T = [
  '{name}, {goal} no se va a pagar solo. Hoy suma.',
  'Lo que quieres cuesta lo mismo hoy que mañana. Empieza hoy, {name}.',
  'Vas en {pct} de {goal}. El siguiente aporte se nota.',
  '{name}: disciplina es elegir lo que quieres más sobre lo que quieres ahora.',
  'Cada peso que apartas es un paso hacia {goal}.',
  'No necesitas motivación, necesitas costumbre. Hoy toca.',
  '{goal} ya está más cerca que ayer. Que siga así.',
  'Nadie lo va a hacer por ti, {name}. Y eso es lo bueno: depende de ti.',
  'Pequeño, pero diario. Así se llega a {goal}.',
  'Hoy no gastes en lo que no recuerdas mañana.',
  'Tu yo del futuro ya te está agradeciendo, {name}.',
  'Faltan {left} para {goal}. Se ve más chico cada semana.',
  'La racha no se cuida sola. Un movimiento hoy.',
  'Primero tú, luego los antojos. Aparta antes de gastar.',
  'Ganas cuando nadie te ve. Hoy es uno de esos días.',
]
const PAYDAY_T = [
  'Hoy cobras, {name}. Aparta {per} antes de gastar.',
  'Día de pago: {per} van para {goal}. Lo demás después.',
  'Llegó la {freq}. Primero tu meta: {per}.',
]
const RISK_T = [
  '{name}, esta semana no has movido nada. Un aporte chico salva tu racha de {streak}.',
  'Tu racha de {streak} semanas está en riesgo. Con cualquier monto la salvas hoy.',
]
const PCT_T: Record<number, string[]> = {
  25: ['Un cuarto de {goal} listo. Ya no hay vuelta atrás.'],
  50: ['¡Mitad de {goal}! Lo difícil ya pasó.'],
  75: ['75% de {goal}. Ya lo hueles.'],
  90: ['90% de {goal}. Último empujón, {name}.'],
}
const VICE_T: Record<number, string> = {
  1: 'Primer día sin {vice}. Así empieza todo.',
  3: '3 días sin {vice}. Lo más duro ya va pasando.',
  7: 'Una semana entera sin {vice}. Eso es fuerza.',
  14: 'Dos semanas sin {vice}. Tu cuerpo ya lo nota.',
  30: '¡30 días sin {vice}! Un mes completo, {name}.',
  60: '60 días sin {vice}. Ya es tu nueva normalidad.',
  90: '90 días sin {vice}. Eres otra persona.',
  180: 'Medio año sin {vice}. Leyenda.',
  365: 'Un año sin {vice}. Lo lograste.',
}

const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '')
const seed = () => { const d = today(); return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate() }
const pickBy = <T,>(arr: T[], n: number) => arr[n % arr.length]

function vars(p: Profile, goals: Goal[]) {
  const act = goals.filter(g => !g.completedAt)
  const g = act[0]
  const money$ = act.filter(isMoney)
  const per = money$.reduce((s, x) => s + pace(x, p.pay).per, 0)
  return {
    name: p.name || 'Oye', goal: g?.title ?? 'tu meta', pct: g ? `${Math.round(progress(g) * 100)}%` : '0%',
    left: g && isMoney(g) ? money(Math.max(0, g.price - saved(g))) : 'poco', per: money(per),
    freq: p.pay === 'quincenal' ? 'quincena' : p.pay === 'mensual' ? 'paga del mes' : 'semana', streak: String(streak(goals)),
  }
}

/** Frase del día para el inicio (cambia cada día, usa tu nombre y tu meta). */
export function dailyMessage(p: Profile, goals: Goal[]) {
  const v = vars(p, goals)
  const pool = goals.length ? DAILY_T : DAILY_T.filter(t => !t.includes('{goal}') && !t.includes('{left}') && !t.includes('{pct}'))
  return fill(pickBy(pool, seed()), v)
}

/* ---------- Avisos ---------- */
const KEY = 'ugoal-notices'
const read = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
const write = (m: Record<string, string>) => { try { localStorage.setItem(KEY, JSON.stringify(m)) } catch { /* sin almacenamiento */ } }

async function show(title: string, body: string) {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) { await reg.showNotification(title, { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png' }); return true }
    }
    new Notification(title, { body, icon: './icons/icon-192.png' }); return true
  } catch { return false }
}

export interface Notice { key: string; title: string; body: string; celebrate?: boolean }

/** Calcula qué avisos tocan hoy. Cada uno sale una sola vez (se recuerda por clave). */
export function dueNotices(p: Profile, goals: Goal[], now = new Date()): Notice[] {
  const v = vars(p, goals), t = iso(today()), out: Notice[] = []
  const d = now.getDate(), last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), wd = now.getDay(), h = now.getHours()
  if (h >= 7) out.push({ key: `daily-${t}`, title: 'UGOAL', body: dailyMessage(p, goals) })
  const payday = p.pay === 'variable' ? wd === 1 : p.pay === 'semanal' ? wd === 5 : p.pay === 'quincenal' ? d === 15 || d === last : d === last
  if (payday && goals.some(g => isMoney(g) && !g.completedAt)) out.push({ key: `pay-${t}`, title: p.pay === 'variable' ? 'Nueva semana' : 'Hoy cobras', body: fill(pickBy(PAYDAY_T, seed()), v) })
  const weekStart = new Date(today()); weekStart.setDate(weekStart.getDate() - ((wd + 6) % 7))
  const ws = iso(weekStart)
  const movedThisWeek = goals.some(g => g.contributions.some(c => c.date >= ws) || g.habit?.checks.some(c => c >= ws) || g.study?.logs.some(l => l.date >= ws) || Object.keys(g.vice?.logs ?? {}).some(k => k >= ws))
  if (wd === 0 && h >= 18 && !movedThisWeek && Number(v.streak) > 0) out.push({ key: `risk-${t}`, title: 'Tu racha está en riesgo', body: fill(pickBy(RISK_T, seed()), v) })
  for (const g of goals) {
    if (g.completedAt) continue
    const pc = progress(g) * 100
    for (const th of [25, 50, 75, 90]) if (pc >= th) {
      const gv = { ...v, goal: g.title, pct: `${th}%` }
      out.push({ key: `pct-${g.id}-${th}`, title: `${th}% de ${g.title}`, body: fill(PCT_T[th][0], gv), celebrate: true })
    }
    if (g.kind === 'vicio' && g.vice?.mode === 'dejar') {
      const days = cleanDays(g)
      for (const m of Object.keys(VICE_T).map(Number)) if (days >= m) out.push({ key: `vice-${g.id}-${g.vice.since}-${m}`, title: `${m} ${m === 1 ? 'día' : 'días'} limpio`, body: fill(VICE_T[m], { ...v, vice: g.title.replace(/^(Dejar (de |el |la |las )?|Menos )/i, '').toLowerCase() }), celebrate: true })
    }
    if (g.kind === 'vicio' && g.vice?.mode === 'bajar' && h >= 20 && !(t in g.vice.logs)) out.push({ key: `vlog-${g.id}-${t}`, title: g.title, body: `${v.name}, ¿cuánto fue hoy? Anótalo para no perder el hilo.` })
    if (g.fixed && isMoney(g) && [30, 7, 1].includes(daysUntil(g.due))) out.push({ key: `due-${g.id}-${daysUntil(g.due)}`, title: g.title, body: `Faltan ${daysUntil(g.due)} ${daysUntil(g.due) === 1 ? 'día' : 'días'}. Llevas ${Math.round(progress(g) * 100)}%.` })
  }
  return out
}

/** Revisa y manda los avisos pendientes. Los logros se muestran también dentro de la app (aunque no haya permiso). */
export async function runNotices(p: Profile, goals: Goal[], inApp: (n: Notice) => void) {
  let first = false
  try { first = localStorage.getItem(KEY) === null } catch { /* nada */ }
  const sent = read()
  const list = dueNotices(p, goals).filter(n => !sent[n.key])
  if (!list.length) return
  // La primera vez solo se marcan los logros que ya tenías, para no llenarte de avisos viejos.
  if (first) { for (const n of list) if (n.celebrate) sent[n.key] = iso(today()) }
  const pending = list.filter(n => !(first && n.celebrate))
  const perm = p.notify && 'Notification' in window && Notification.permission === 'granted'
  // Un aviso de sistema a la vez para no saturar: el más importante primero.
  const rank = (n: Notice) => (n.celebrate ? 0 : n.key.startsWith('pay') ? 1 : n.key.startsWith('risk') ? 2 : 3)
  pending.sort((a, b) => rank(a) - rank(b))
  let shown = false, pushed = 0
  for (const n of pending) {
    sent[n.key] = iso(today())
    if (n.celebrate && !shown) { inApp(n); shown = true }
    if (perm && pushed < 2) { await show(n.title, n.body); pushed++ }
  }
  // limpia claves viejas (más de 60 días)
  const cut = iso(new Date(today().getTime() - 60 * 86400000))
  for (const k of Object.keys(sent)) if (sent[k] < cut && !k.startsWith('pct-') && !k.startsWith('vice-')) delete sent[k]
  write(sent)
}
