import type { Goal, PayFreq } from '../types'
import { DAY, iso, parse, today } from './format'

/** Días de pago desde mañana hasta la fecha meta (incluida). Quincenal = día 15 y último día del mes.
 *  Ingreso variable: se cuenta por semana (cada lunes es un nuevo "corte"). */
export function payDates(freq: PayFreq, until: string, from: Date = today()): string[] {
  const end = parse(until)
  const out: string[] = []
  const d = new Date(from)
  if (freq === 'semanal' || freq === 'variable') {
    d.setDate(d.getDate() + 7)
    while (d <= end) { out.push(iso(d)); d.setDate(d.getDate() + 7) }
  } else {
    const cur = new Date(from.getFullYear(), from.getMonth(), 1)
    while (cur <= end) {
      const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const dates = freq === 'quincenal' ? [new Date(cur.getFullYear(), cur.getMonth(), 15), last] : [last]
      for (const x of dates) if (x > from && x <= end) out.push(iso(x))
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return out
}

/** Fecha del n-ésimo pago a partir de hoy (n empieza en 1). */
export function nthPay(freq: PayFreq, n: number): string {
  const far = new Date(today()); far.setFullYear(far.getFullYear() + 60)
  const dates = payDates(freq, iso(far))
  return dates[Math.min(dates.length - 1, Math.max(0, n - 1))]
}

export const freqWord = (f: PayFreq) => (f === 'semanal' || f === 'variable' ? 'semana' : f === 'quincenal' ? 'quincena' : 'mes')
export const freqPlural = (f: PayFreq) => (f === 'semanal' || f === 'variable' ? 'semanas' : f === 'quincenal' ? 'quincenas' : 'meses')
export const payLabel = (f: PayFreq) => (f === 'variable' ? 'Ingreso variable' : `Cobras cada ${freqWord(f)}`)

export const isMoney = (g: Goal) => g.kind === 'compra' || g.kind === 'viaje'
/** Tu parte: en grupo con partes iguales es precio ÷ personas; en modo "lo que pueda cada quien" la meta es de todos. */
export const myPrice = (g: Goal) => (g.group && !g.flex ? g.price / g.group.members.length : g.price)
export const mySaved = (g: Goal) => Math.max(0, g.contributions.reduce((s, c) => s + c.amount, 0))
export const groupSaved = (g: Goal) => (g.group ? g.group.members.reduce((s, m) => s + (m.isMe ? mySaved(g) : m.paid), 0) : mySaved(g))
/** Lo que cuenta para la meta: lo tuyo, o lo de todos si es "lo que pueda cada quien". */
export const saved = (g: Goal) => (g.flex ? groupSaved(g) : mySaved(g))
export const remaining = (g: Goal) => Math.max(0, myPrice(g) - saved(g))

export const metricNow = (g: Goal) => (g.metrics?.length ? g.metrics[g.metrics.length - 1].value : g.plan?.base ?? 0)

/* ---------- Vicios ---------- */
export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / DAY)
export const cleanDays = (g: Goal) => (g.vice ? Math.max(0, daysBetween(g.vice.since, iso(today()))) : 0)
/** Límite del día para el modo "bajarle poco a poco": baja parejo cada semana hasta llegar a cero. */
export function viceLimit(g: Goal, day: string = iso(today())) {
  const v = g.vice!
  const w = Math.floor(Math.max(0, daysBetween(g.start, day)) / 7)
  return Math.max(0, Math.round(v.startPerDay * (1 - (w + 1) / v.weeks)))
}
/** Días (desde el inicio hasta ayer) en los que te mantuviste dentro del límite. */
export function daysUnder(g: Goal) {
  const v = g.vice!, total = Math.min(v.weeks * 7, daysBetween(g.start, iso(today())) + 1)
  let ok = 0
  for (let i = 0; i < total; i++) {
    const d = iso(new Date(parse(g.start).getTime() + i * DAY))
    if (d in v.logs && v.logs[d] <= viceLimit(g, d)) ok++
  }
  return ok
}

/* ---------- Estudios ---------- */
export const studyHours = (g: Goal) => (g.study?.logs ?? []).reduce((s, l) => s + l.minutes, 0) / 60

export function progress(g: Goal): number {
  if (isMoney(g)) return g.price ? Math.min(1, saved(g) / myPrice(g)) : 0
  if (g.kind === 'plan' && g.plan) {
    const { base, target } = g.plan
    const sessions = g.plan.weeks.flat()
    const bySessions = sessions.filter(s => s.done).length / sessions.length
    const byMetric = target === base ? 0 : Math.max(0, Math.min(1, (metricNow(g) - base) / (target - base)))
    return Math.max(bySessions, byMetric)
  }
  if (g.kind === 'habito' && g.habit) return Math.min(1, g.habit.checks.length / g.habit.days)
  if (g.kind === 'vicio' && g.vice) return g.vice.mode === 'dejar' ? Math.min(1, cleanDays(g) / g.vice.targetDays) : Math.min(1, daysUnder(g) / (g.vice.weeks * 7))
  if (g.kind === 'estudio' && g.study) {
    const s = g.study
    if (s.mode === 'horas') return Math.min(1, studyHours(g) / s.target)
    if (s.mode === 'examen') return s.topics?.length ? s.topics.filter(t => t.done).length / s.topics.length : 0
    return Math.min(1, (s.books?.filter(b => b.done).length ?? 0) / s.target)
  }
  return 0
}

/** Cuánto apartar por día de pago, y si vas arriba o abajo del ritmo lineal. */
export function pace(g: Goal, freq: PayFreq) {
  const left = remaining(g)
  const dates = payDates(freq, g.due)
  const periods = Math.max(1, dates.length)
  const per = left / periods
  const total = Math.max(1, (parse(g.due).getTime() - parse(g.start).getTime()) / DAY)
  const elapsed = Math.min(total, Math.max(0, (today().getTime() - parse(g.start).getTime()) / DAY))
  const expected = myPrice(g) * (elapsed / total)
  const diff = saved(g) - expected
  return { per, periods, nextPay: dates[0], diff, behind: diff < -Math.max(50, per * 0.25) }
}

/** ¿Y si aparto otra cantidad? Devuelve en qué fecha la cumplirías. */
export function simulate(g: Goal, perPay: number, freq: PayFreq) {
  const left = remaining(g)
  if (left <= 0) return { date: iso(today()), periods: 0 }
  if (perPay <= 0) return null
  const periods = Math.ceil(left / perPay)
  return { date: nthPay(freq, periods), periods }
}

/** Con tu ritmo real (lo apartado desde que empezaste), ¿cuándo llegarías? Necesita al menos 2 semanas de historia. */
export function projection(g: Goal) {
  const days = daysBetween(g.start, iso(today()))
  const real = g.contributions.filter(c => c.note !== 'Lo que ya tenía').reduce((s, c) => s + c.amount, 0)
  if (days < 14 || real <= 0) return null
  const perDay = real / days
  const need = remaining(g) / perDay
  const date = iso(new Date(today().getTime() + need * DAY))
  return { date, late: daysBetween(g.due, date) }
}

/** Mensualidad aproximada de un crédito (amortización francesa). */
export function creditPayment(c: NonNullable<Goal['credit']>) {
  const P = c.full * (1 - c.pct / 100), r = c.rate / 100 / 12
  return r ? (P * r) / (1 - (1 + r) ** -c.months) : P / c.months
}

/** Reparte un monto entre metas de dinero: primero lo que le toca a cada una para ir al día, y lo que sobre a la principal. */
export function distribute(goals: Goal[], amount: number, freq: PayFreq, mainId?: string) {
  const act = goals.filter(g => isMoney(g) && !g.completedAt && remaining(g) > 0)
  const need = act.map(g => Math.min(remaining(g), Math.max(0, pace(g, freq).per)))
  const totalNeed = need.reduce((s, n) => s + n, 0)
  const out = act.map((g, i) => ({ g, amount: totalNeed > 0 ? Math.min(need[i], (amount * need[i]) / totalNeed) : 0 }))
  let extra = amount - out.reduce((s, o) => s + o.amount, 0)
  const order = [...out].sort((a, b) => (a.g.id === mainId ? -1 : b.g.id === mainId ? 1 : a.g.due.localeCompare(b.g.due)))
  for (const o of order) {
    if (extra <= 0.5) break
    const room = remaining(o.g) - o.amount
    const add = Math.min(room, extra)
    o.amount += add; extra -= add
  }
  return out.map(o => ({ ...o, amount: Math.round(o.amount) })).filter(o => o.amount > 0)
}

/** Semana actual de un plan físico (1-indexada). */
export const planWeek = (g: Goal) => {
  if (!g.plan) return 1
  const w = Math.floor((today().getTime() - parse(g.start).getTime()) / DAY / 7) + 1
  return Math.min(g.plan.weeks.length, Math.max(1, w))
}

/** Racha: semanas consecutivas (hasta esta) con al menos un aporte o avance registrado en cualquier meta. */
export function streak(goals: Goal[]): number {
  const stamps = new Set<number>()
  const wk = (s: string) => Math.floor((parse(s).getTime() - parse('2024-01-01').getTime()) / DAY / 7)
  for (const g of goals) {
    g.contributions.forEach(c => c.amount > 0 && stamps.add(wk(c.date)))
    g.metrics?.forEach(m => stamps.add(wk(m.date)))
    g.habit?.checks.forEach(c => stamps.add(wk(c)))
    g.study?.logs.forEach(l => stamps.add(wk(l.date)))
    if (g.vice) Object.keys(g.vice.logs).forEach(d => stamps.add(wk(d)))
    if (g.vice?.mode === 'dejar') for (let d = parse(g.vice.since); d <= today(); d = new Date(d.getTime() + 7 * DAY)) stamps.add(wk(iso(d)))
    if (g.vice?.mode === 'dejar' && cleanDays(g) > 0) stamps.add(wk(iso(today())))
  }
  let n = 0
  let w = wk(iso(today()))
  if (!stamps.has(w)) w -= 1 // la semana actual todavía puede completarse
  while (stamps.has(w)) { n++; w-- }
  return n
}
