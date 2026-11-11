const mxn0 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const mxn2 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** $18,000 si es cerrado; $18,000.50 si trae centavos. */
export const money = (n: number) => { const r = Math.round(n * 100) / 100; return Number.isInteger(r) ? mxn0.format(r) : mxn2.format(r) }
/** Formatea mientras escribes: 10000 → 10,000 · 1234.5 → 1,234.5 (máx. 2 decimales). */
export const typed = (s: string) => {
  const clean = s.replace(/[^0-9.]/g, '')
  const [int, ...rest] = clean.split('.')
  const dec = rest.length ? '.' + rest.join('').slice(0, 2) : ''
  const i = int.replace(/^0+(?=\d)/, '')
  return (i ? Number(i).toLocaleString('en-US') : rest.length ? '0' : '') + dec
}
/** Convierte lo escrito (con comas) a número. */
export const toNum = (s: string) => parseFloat(String(s).replace(/,/g, '')) || 0
export const num = (n: number, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('es-MX')

export const DAY = 86_400_000
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parse = (s: string) => new Date(s + 'T00:00:00')
export const addDays = (s: string | Date, n: number) => { const d = typeof s === 'string' ? parse(s) : new Date(s); d.setDate(d.getDate() + n); return iso(d) }
export const addMonths = (n: number) => { const d = today(); d.setMonth(d.getMonth() + n); return iso(d) }
export const fDate = (s: string) => parse(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
export const fShort = (s: string) => parse(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
export const fMonth = (s: string) => parse(s).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
export const daysUntil = (s: string) => Math.ceil((parse(s).getTime() - today().getTime()) / DAY)
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
