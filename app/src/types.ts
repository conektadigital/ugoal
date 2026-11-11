export type CatKey = 'autos' | 'moda' | 'tech' | 'casa' | 'viajes' | 'fisico' | 'finanzas' | 'estudios' | 'vicios' | 'escuela' | 'negocio' | 'eventos' | 'deudas' | 'salud'
export type PayFreq = 'semanal' | 'quincenal' | 'mensual' | 'variable'
export type GoalKind = 'compra' | 'viaje' | 'plan' | 'habito' | 'vicio' | 'estudio'

export interface CatalogItem {
  id: string
  cat: CatKey
  type: string // subtipo dentro de la categoría (celulares, motos, playas…)
  group: string // marca, región, cuarto o grupo
  name: string
  brand: string // texto corto bajo el nombre
  price?: number // precio de referencia en MXN
  img: string // ruta en /catalog, "icon:<clave>" o "ph:" (tarjeta de marca sin foto)
  mode: 'cut' | 'full'
  parts?: { name: string; amount: number }[] // desglose sugerido (negocios, eventos, escuela)
}

export interface Contribution { id: string; date: string; amount: number; note?: string; partId?: string }
export interface TripPart { id: string; name: string; amount: number }
export interface CheckItem { id: string; text: string; date?: string; done: boolean }
export interface Session { t: string; done: boolean }
export interface Member { id: string; name: string; isMe?: boolean; paid: number; show: 'monto' | 'pct' }

/** Dejar un vicio de golpe (días limpio) o bajarle poco a poco (límite diario que baja cada semana). */
export interface Vice {
  mode: 'dejar' | 'bajar'
  unit: string // "cigarros", "copas", "horas"…
  since: string // inicio de la racha actual
  best: number // mejor racha en días
  relapses: string[]
  startPerDay: number // cuánto consumías al día al empezar (modo bajar)
  weeks: number // semanas para llegar a cero (modo bajar)
  logs: Record<string, number> // consumo por día (modo bajar)
  targetDays: number // días limpio que buscas (modo dejar)
}

/** Metas de estudio sin dinero: horas de enfoque, examen con temario o libros. */
export interface Study {
  mode: 'horas' | 'examen' | 'libros'
  target: number // horas o libros
  logs: { date: string; minutes: number }[]
  topics?: CheckItem[]
  books?: { id: string; title: string; done: boolean }[]
}

export interface Goal {
  id: string
  cat: CatKey
  kind: GoalKind
  itemId?: string
  title: string
  photo: string // ruta de catálogo, dataURL subida o "icon:<clave>"
  photoMode: 'cut' | 'full'
  price: number // 0 para metas sin dinero
  start: string // YYYY-MM-DD
  due: string
  why?: string
  contributions: Contribution[]
  parts?: TripPart[]
  checklist?: CheckItem[]
  plan?: { weeks: Session[][]; unit: string; base: number; target: number; label: string }
  metrics?: { date: string; value: number }[]
  habit?: { days: number; checks: string[] }
  group?: { code: string; members: Member[] }
  progressPhotos?: { date: string; src: string }[]
  vice?: Vice
  study?: Study
  /** Meta que solo junta el enganche: precio completo, % de enganche, plazo y tasa anual aproximada. */
  credit?: { full: number; pct: number; months: number; rate: number }
  fixed?: boolean // la fecha es un evento: no se puede mover
  emergency?: boolean // fondo de emergencia
  letter?: string // carta a tu yo del futuro, se abre al cumplir
  forWhom?: string // escuela: para quién es (hijo, hermano)
  repeat?: boolean // escuela: se repite cada semestre
  debts?: { id: string; name: string; amount: number }[] // bola de nieve
  flex?: boolean // grupo/pareja: cada quien pone lo que puede
  biz?: { open: boolean; logs: { id: string; date: string; amount: number; kind: 'venta' | 'gasto'; note?: string }[] }
  completedAt?: string
  createdAt: string
}

export interface Tanda {
  id: string
  name: string
  amount: number // lo que pone cada quien por vuelta
  freq: 'semanal' | 'quincenal' | 'mensual'
  start: string
  members: { id: string; name: string; isMe?: boolean }[] // en orden de turno
  paid: Record<number, string[]> // vuelta → ids que ya pagaron
  createdAt: string
}

export type RetoKind = '52semanas' | '30dias' | 'sobres' | 'antojos' | 'monto' | 'diario' | 'sube' | 'semanal'
export interface Reto {
  id: string
  kind: RetoKind
  base: number
  weeks?: number // retos que eliges: cuántas semanas o días
  start: string
  goalId?: string // a qué meta se suma el dinero
  marks: Record<number, string> // paso → id del aporte (o "x" si no hay dinero)
}

export interface Profile {
  name: string
  pay: PayFreq
  interests: CatKey[]
  onboarded: boolean
  theme: 'dark' | 'light' | 'system'
  notify: boolean
  monthly?: number // gasto mensual aproximado (para el fondo de emergencia)
  pin?: string // huella del código de bloqueo
}
