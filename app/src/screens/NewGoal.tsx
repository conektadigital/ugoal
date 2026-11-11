import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Lock, Minus, Plus, Search, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { back, go } from '../router'
import { AREAS, CAT, CATALOG_COUNT, CATS, ITEM, LOGOS, VICES, byCat, catArt, groupsOf, itemTitle, typesOf } from '../data/categories'
import type { CatKey, CatalogItem, Goal } from '../types'
import { creditPayment, freqPlural, freqWord, payDates } from '../lib/calc'
import { addMonths, fDate, iso, money, today, typed, uid } from '../lib/format'
import { PLANS, buildWeeks, type PlanDef } from '../lib/plans'
import { BrandLogo, Photo, Press, burst, toast } from '../components/ui'

/** Se activa desde Grupos para que el formulario abra con "meta en grupo" encendido. */
export const newGoalPrefs = { group: false }

const TRIP_PARTS = ['Vuelos', 'Hospedaje', 'Comida', 'Actividades', 'Transporte local']
const TRIP_CHECKS = ['Revisar pasaporte o INE vigente', 'Comprar vuelos', 'Reservar hospedaje', 'Contratar seguro de viaje', 'Hacer la maleta']

export async function fileToDataUrl(file: File, max = 1100): Promise<string> {
  const url = URL.createObjectURL(file)
  const img = new Image(); img.src = url
  await new Promise((r, j) => { img.onload = r; img.onerror = j })
  const s = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  URL.revokeObjectURL(url)
  return c.toDataURL('image/jpeg', 0.82)
}

function Header({ title, sub, onBack }: { title: string; sub?: string; onBack: () => void }) {
  return (
    <>
      <div className="topbar"><button className="iconbtn" onClick={onBack} aria-label="Regresar"><ArrowLeft /></button><span /></div>
      <div className="col" style={{ gap: 8 }}><h1 className="t-xl">{title}</h1>{sub && <p className="t-body">{sub}</p>}</div>
    </>
  )
}

export default function NewGoal({ cat, item }: { cat?: string; item?: string }) {
  if (!cat || !CAT[cat as CatKey]) return <PickCategory />
  if (!item) return <PickGroup cat={cat as CatKey} />
  if (item.startsWith('~')) return <PickModel cat={cat as CatKey} group={item.slice(1)} />
  return <Details cat={cat as CatKey} itemId={item} />
}

/** Mosaico de categorías por área, con íconos 3D. */
export function CategoryGrid({ onPick }: { onPick: (k: CatKey) => void }) {
  const { profile } = useStore()
  let i = 0
  return (
    <div className="col" style={{ gap: 22 }}>
      {AREAS.map(a => (
        <section key={a.key} className="col" style={{ gap: 10 }}>
          <span className="t-xs">{a.label}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {CATS.filter(c => c.area === a.key).sort((x, y) => Number(profile.interests.includes(y.key)) - Number(profile.interests.includes(x.key))).map((c, ci) => (
              <motion.button key={c.key} type="button" className="glass cat-tile" onClick={() => onPick(c.key)} aria-label={c.label}
                initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i++ * 0.03, type: 'spring', stiffness: 300, damping: 24 }} whileTap={{ scale: 0.95 }}
                style={{ ['--tone' as string]: c.tone }}>
                <motion.img className="cat-bg" src={catArt(c.key)} alt="" draggable={false} animate={{ scale: [1.02, 1.1, 1.02] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: ci * 0.4 }} />
                <span className="col cat-label" style={{ gap: 1, textAlign: 'left' }}><b>{c.label}</b><span style={{ fontSize: 12, opacity: 0.85 }}>{c.hint}</span></span>
              </motion.button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function PickCategory() {
  return (
    <div className="screen">
      <Header title="¿Qué quieres lograr?" sub={`${CATALOG_COUNT.toLocaleString('es-MX')} ideas reales, o la tuya.`} onBack={() => back('/')} />
      <CategoryGrid onPick={k => go(`/nueva/${k}`)} />
    </div>
  )
}

/** Buscador dentro de una categoría. */
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="input glass" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Search size={18} color="var(--muted)" />
      <input style={{ border: 0, background: 'transparent', outline: 'none', flex: 1, minWidth: 0, fontSize: 16 }} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} aria-label="Buscar" />
    </label>
  )
}

export function ItemCard({ it, onClick, wide }: { it: CatalogItem; onClick: () => void; wide?: boolean }) {
  return (
    <Press onClick={onClick} style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }} label={it.name}>
      <Photo src={it.img} mode={it.mode} ratio={it.mode === 'cut' ? '1/1' : wide ? '4/5' : '3/4'} />
      <span className="col" style={{ gap: 2 }}>
        <b style={{ fontSize: 14, lineHeight: 1.2 }}>{it.name}</b>
        <span className="t-sm" style={{ fontSize: 12 }}>{it.price ? `desde ${money(it.price)}` : it.brand}</span>
      </span>
    </Press>
  )
}

/** Carrusel horizontal: se ven 2 y media tarjetas, nunca una lista infinita. */
export function Carousel({ title, sub, items, onPick, onAll }: { title: string; sub?: string; items: CatalogItem[]; onPick: (it: CatalogItem) => void; onAll?: () => void }) {
  return (
    <section className="col" style={{ gap: 10 }}>
      <div className="row"><span className="col" style={{ gap: 0 }}><h2 className="t-md">{title}</h2>{sub && <span className="t-sm">{sub}</span>}</span>{onAll && <button className="link" onClick={onAll}>Ver todo</button>}</div>
      <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -20px', padding: '0 20px 4px', scrollSnapType: 'x mandatory' }}>
        {items.map((it, i) => (
          <motion.div key={it.id} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 6) * 0.04 }} style={{ flex: '0 0 40%', scrollSnapAlign: 'start' }}>
            <ItemCard it={it} onClick={() => onPick(it)} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/** Mosaico de marcas (o regiones / cuartos) con la primera foto que haya. */
export function GroupGrid({ cat, type, onPick }: { cat: CatKey; type?: string; onPick: (g: string) => void }) {
  const groups = groupsOf(cat, type)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
      {groups.map((g, i) => {
        const pic = g.items.find(x => !x.img.startsWith('ph:'))
        const logo = !!LOGOS[g.name]
        return (
          <motion.button key={g.name} type="button" className="glass brand-tile" onClick={() => onPick(g.name)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 14) * 0.025 }} whileTap={{ scale: 0.96 }}>
            <span className={`brand-pic ${logo ? 'logo' : ''}`}>{logo ? <BrandLogo name={g.name} size={34} /> : pic ? <Photo src={pic.img} mode={pic.mode} ratio="1/1" shade={false} /> : <img src={catArt(cat)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</span>
            <span className="col" style={{ gap: 0, minWidth: 0, textAlign: 'left' }}><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</b><span className="t-sm" style={{ fontSize: 12 }}>{g.items.length} {g.items.length === 1 ? 'opción' : 'opciones'}</span></span>
          </motion.button>
        )
      })}
    </div>
  )
}

const BRANDED: CatKey[] = ['autos', 'tech', 'moda', 'casa', 'viajes']

function PickGroup({ cat }: { cat: CatKey }) {
  const meta = CAT[cat]
  const types = typesOf(cat)
  const [type, setType] = useState(types[0]?.key)
  const [q, setQ] = useState('')
  const t = q.trim().toLowerCase()
  const found = t ? byCat(cat).filter(i => `${i.group} ${i.name}`.toLowerCase().includes(t)).slice(0, 40) : []
  const pick = (it: CatalogItem) => go(`/nueva/${cat}/${it.id}`)
  return (
    <div className="screen" style={{ gap: 18 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back('/nueva')} aria-label="Regresar"><ArrowLeft /></button><span /></div>
      <div className="row" style={{ alignItems: 'center', justifyContent: 'flex-start', gap: 14 }}>
        <motion.img src={catArt(cat)} alt="" style={{ width: 64, height: 64, borderRadius: 20, objectFit: 'cover' }} initial={{ scale: 0.4, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} />
        <div className="col" style={{ gap: 2 }}><h1 className="t-xl">{meta.label}</h1><p className="t-sm">{cat === 'vicios' ? 'Sin juicios: aquí solo se avanza.' : meta.hint}</p></div>
      </div>
      <SearchBox value={q} onChange={setQ} placeholder={BRANDED.includes(cat) ? `Busca una ${meta.groupLabel.toLowerCase()} o modelo` : 'Buscar'} />
      {t ? (
        found.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 12px' }}>{found.map(it => <ItemCard key={it.id} it={it} onClick={() => pick(it)} />)}</div>
          : <p className="empty">No está. Crea la tuya con tu foto.</p>
      ) : BRANDED.includes(cat) ? (
        <>
          {types.length > 1 && (
            <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}>
              {types.map(x => (
                <button key={x.key} className={`pill ${type === x.key ? 'on' : ''}`} onClick={() => setType(x.key)}>
                  {type === x.key && <motion.span layoutId="type-pill" className="pill-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}<span style={{ position: 'relative' }}>{x.label}</span>
                </button>
              ))}
            </div>
          )}
          <GroupGrid cat={cat} type={type} onPick={g => go(`/nueva/${cat}/~${g}`)} />
        </>
      ) : (
        groupsOf(cat).map(g => <Carousel key={g.name} title={g.name} items={g.items} onPick={pick} />)
      )}
      <OwnCard cat={cat} />
    </div>
  )
}

/** Crear una meta propia: con tu foto, o "otro" en vicios. */
function OwnCard({ cat }: { cat: CatKey }) {
  const own = async (f?: File) => {
    if (!f) return
    try { sessionStorage.setItem('ugoal-own-photo', await fileToDataUrl(f)); go(`/nueva/${cat}/propia`) } catch { toast('No pudimos abrir esa foto. Prueba con otra.') }
  }
  const inner = (
    <>
      <span style={{ width: 46, height: 46, borderRadius: 16, background: 'var(--lime-soft)', color: 'var(--lime-text)', display: 'grid', placeItems: 'center', flex: 'none' }}>{cat === 'vicios' ? <Plus /> : <Camera />}</span>
      <span className="col" style={{ gap: 0, textAlign: 'left' }}><b>{cat === 'vicios' ? 'Otro vicio' : '¿No está? Crea la tuya'}</b><span className="t-sm">{cat === 'vicios' ? 'Escribe el tuyo' : 'Con tu propia foto y tu precio'}</span></span>
    </>
  )
  return cat === 'vicios'
    ? <button className="glass own-card" onClick={() => { sessionStorage.removeItem('ugoal-own-photo'); go('/nueva/vicios/propia') }}>{inner}</button>
    : <label className="glass own-card">{inner}<input type="file" accept="image/*" hidden onChange={e => own(e.target.files?.[0])} /></label>
}

function PickModel({ cat, group }: { cat: CatKey; group: string }) {
  const items = byCat(cat).filter(i => i.group === group)
  const [q, setQ] = useState('')
  const list = items.filter(i => !q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase()))
  const types = [...new Set(list.map(i => i.type))]
  return (
    <div className="screen" style={{ gap: 18 }}>
      <Header title={group} sub={`${items.length} ${items.length === 1 ? 'opción' : 'opciones'} · toca la que quieres`} onBack={() => back(`/nueva/${cat}`)} />
      {items.length > 8 && <SearchBox value={q} onChange={setQ} placeholder={`Buscar en ${group}`} />}
      {types.map(t => (
        <section key={t} className="col" style={{ gap: 10 }}>
          {types.length > 1 && <h2 className="t-md">{typesOf(cat).find(x => x.key === t)?.label}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 12px' }}>
            {list.filter(i => i.type === t).map((it, i) => (
              <motion.div key={it.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                <ItemCard it={it} onClick={() => go(`/nueva/${cat}/${it.id}`)} />
              </motion.div>
            ))}
          </div>
        </section>
      ))}
      <OwnCard cat={cat} />
    </div>
  )
}

const EXAM_ITEMS = ['toefl', 'pmp', 'titulacion', 'manejo']
const EXAM_TOPICS: Record<string, string[]> = {
  toefl: ['Reading', 'Listening', 'Speaking', 'Writing', 'Examen de práctica completo'],
  pmp: ['35 horas de curso', 'Guía PMBOK', 'Ágil e híbrido', 'Simulador de 180 preguntas', 'Agendar examen'],
  titulacion: ['Elegir modalidad', 'Tema o protocolo', 'Primer borrador', 'Revisión del asesor', 'Trámites y pagos', 'Presentación'],
  manejo: ['Reglamento de tránsito', 'Examen teórico de práctica', 'Prácticas de manejo', 'Estacionarse en batería y en paralelo', 'Agendar cita'],
}
const CREDIT_CATS: CatKey[] = ['autos', 'casa']

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className="seg">{options.map(([v, l]) => <button key={String(v)} type="button" className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>
}
export function Chips<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
      {options.map(([v, l]) => <button key={String(v)} type="button" className={`chip ${value === v ? 'lime' : ''}`} style={{ height: 36, flex: 'none' }} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}
const n = (s: string) => parseFloat(s.replace(/,/g, '')) || 0

function Details({ cat, itemId }: { cat: CatKey; itemId: string }) {
  const { profile, addGoal, setProfile } = useStore()
  const meta = CAT[cat]
  const it = itemId === 'propia' ? null : ITEM[itemId]
  const photo = it ? it.img : sessionStorage.getItem('ugoal-own-photo') || (cat === 'vicios' ? 'icon:otro' : '')
  const mode = it ? it.mode : 'full'
  const isTrip = meta.kind === 'viaje'
  const partNames = isTrip ? TRIP_PARTS : it?.parts?.map(p => p.name) ?? []
  const hasParts = partNames.length > 0
  const isDebt = cat === 'deudas'
  const isSnow = it?.id === 'bola-nieve'
  const isSchool = cat === 'escuela'
  const isBiz = cat === 'negocio'
  const isVice = meta.kind === 'vicio'
  const isStudy = meta.kind === 'estudio'
  const fis = meta.kind === 'fisico' ? (it && PLANS[it.id]) || { kind: 'habito' as const, days: 30, label: 'Días cumplidos' } : null
  const viceKey = it?.id.replace('vicio-', '') ?? ''
  const viceDef = VICES[viceKey] ?? { unit: 'veces', per: 3, mode: 'dejar' as const }
  const isFund = it?.id === 'fondo3' || it?.id === 'fondo6'
  const fundMonths = it?.id === 'fondo6' ? 6 : 3

  const [title, setTitle] = useState(it ? (isTrip ? `Viaje a ${it.name}` : itemTitle(it)) : '')
  const [price, setPrice] = useState(it?.price ? typed(String(it.price)) : '')
  const [debts, setDebts] = useState<{ name: string; amount: string }[]>([{ name: 'Tarjeta', amount: '' }, { name: 'Préstamo', amount: '' }])
  const [forWhom, setForWhom] = useState('')
  const [repeat, setRepeat] = useState(isSchool)
  const [flex, setFlex] = useState(false)
  const [have, setHave] = useState('')
  const [due, setDue] = useState(addMonths(isTrip ? 8 : it && EXAM_ITEMS.includes(it.id) ? 3 : 12))
  const [why, setWhy] = useState('')
  const [letter, setLetter] = useState('')
  const [parts, setParts] = useState<Record<string, string>>(() => Object.fromEntries((it?.parts ?? []).map(p => [p.name, typed(String(p.amount))])))
  const [group, setGroup] = useState(newGoalPrefs.group)
  const [people, setPeople] = useState<string[]>(['', ''])
  const [base, setBase] = useState(fis && fis.kind === 'plan' ? String(fis.base) : '')
  const [fixed, setFixed] = useState(isTrip || cat === 'eventos' || isSchool)
  const [credit, setCredit] = useState(false)
  const [pct, setPct] = useState(20), [months, setMonths] = useState(48), [rate, setRate] = useState('14')
  const [monthly, setMonthly] = useState(profile.monthly ? typed(String(profile.monthly)) : '')
  // vicios
  const [vMode, setVMode] = useState<'dejar' | 'bajar'>(viceDef.mode)
  const [vUnit, setVUnit] = useState(viceDef.unit)
  const [vPer, setVPer] = useState(String(viceDef.per))
  const [vDays, setVDays] = useState(90)
  const [vWeeks, setVWeeks] = useState(6)
  // estudios
  const defStudy: 'horas' | 'examen' | 'libros' | 'dinero' = it?.id === 'lectura' ? 'libros' : it && EXAM_ITEMS.includes(it.id) ? 'examen' : 'horas'
  const [sMode, setSMode] = useState<'horas' | 'examen' | 'libros' | 'dinero'>(defStudy)
  const [hours, setHours] = useState(50)
  const [books, setBooks] = useState(12)
  const [topics, setTopics] = useState((it && EXAM_TOPICS[it.id]?.join('\n')) || '')
  useEffect(() => () => { newGoalPrefs.group = false }, [])

  const money$ = !fis && !isVice && !(isStudy && sMode !== 'dinero')
  const canCredit = CREDIT_CATS.includes(cat) && !group
  const tripTotal = partNames.reduce((s, p) => s + n(parts[p] || '0'), 0)
  const debtTotal = debts.reduce((s, d) => s + n(d.amount), 0)
  const full = hasParts ? tripTotal : isSnow ? debtTotal : isFund ? n(monthly) * fundMonths : n(price)
  const total = credit && canCredit ? Math.round((full * pct) / 100) : full
  const members = group ? 1 + people.filter(p => p.trim()).length : 1
  const mine = flex ? total : total / Math.max(1, members)
  const haveN = n(have)
  const periods = useMemo(() => Math.max(1, payDates(profile.pay, due).length), [profile.pay, due])
  const per = Math.max(0, mine - haveN) / periods
  const creditDef = { full, pct, months, rate: n(rate) }

  if (!photo) return <div className="screen"><Header title="Falta la foto" onBack={() => go(`/nueva/${cat}`)} /><button className="btn" onClick={() => go(`/nueva/${cat}`)}>Elegir de nuevo</button></div>

  const save = () => {
    if (!title.trim() && !it) { toast('Ponle un nombre a tu meta'); return }
    if (money$ && !(total > 0)) { toast(hasParts ? 'Escribe cuánto cuesta al menos una parte' : isSnow ? 'Escribe cuánto debes en cada una' : isFund ? 'Escribe cuánto gastas al mes' : isDebt ? 'Escribe cuánto debes' : 'Escribe el precio'); return }
    const id = uid(), start = iso(today())
    const g: Goal = { id, cat, kind: 'compra', itemId: it?.id, title: title.trim() || it?.name || 'Mi meta', photo, photoMode: mode, price: total, start, due, why: why.trim() || undefined, letter: letter.trim() || undefined, contributions: [], createdAt: start }
    if (money$) {
      if (fixed) g.fixed = true
      if (credit && canCredit) { g.credit = creditDef; if (!g.title.toLowerCase().startsWith('enganche')) g.title = `Enganche · ${g.title}` }
      if (isFund) { g.emergency = true; setProfile({ monthly: n(monthly) }) }
    }
    if (hasParts) g.parts = partNames.filter(p => n(parts[p] || '0') > 0).map(p => ({ id: uid(), name: p, amount: n(parts[p]) }))
    if (isTrip) {
      g.kind = 'viaje'
      g.checklist = TRIP_CHECKS.map((t, i) => ({ id: uid(), text: t, done: false, date: i === TRIP_CHECKS.length - 1 ? due : undefined }))
    }
    if (cat === 'eventos') g.checklist = (g.parts ?? []).map(p => ({ id: uid(), text: `Apartar y contratar: ${p.name.toLowerCase()}`, done: false }))
    if (isSnow) g.debts = debts.filter(d => n(d.amount) > 0).map(d => ({ id: uid(), name: d.name.trim() || 'Deuda', amount: n(d.amount) }))
    if (isSchool) { if (forWhom.trim()) g.forWhom = forWhom.trim(); if (repeat) g.repeat = true }
    if (isBiz) g.biz = { open: false, logs: [] }
    if (group && flex && money$) g.flex = true
    if (fis) {
      g.price = 0
      if (fis.kind === 'plan') {
        const def = fis as PlanDef
        const b = base === '' ? def.base : n(base)
        g.kind = 'plan'
        g.plan = { weeks: buildWeeks(def), unit: def.unit, base: b, target: def.target, label: def.label }
        g.metrics = [{ date: start, value: b }]
        g.due = iso(new Date(today().getTime() + def.weeks * 7 * 86400000))
      } else { g.kind = 'habito'; g.habit = { days: fis.days, checks: [] }; g.due = iso(new Date(today().getTime() + fis.days * 86400000)) }
    }
    if (isVice) {
      g.kind = 'vicio'; g.price = 0
      const weeks = vMode === 'bajar' ? vWeeks : 0
      g.vice = { mode: vMode, unit: vUnit.trim() || 'veces', since: start, best: 0, relapses: [], startPerDay: Math.max(1, n(vPer)), weeks, logs: {}, targetDays: vDays }
      g.due = iso(new Date(today().getTime() + (vMode === 'bajar' ? weeks * 7 : vDays) * 86400000))
    }
    if (isStudy && sMode !== 'dinero') {
      g.kind = 'estudio'; g.price = 0
      g.study = { mode: sMode, target: sMode === 'horas' ? hours : sMode === 'libros' ? books : 0, logs: [] }
      if (sMode === 'examen') {
        const list = topics.split('\n').map(t => t.trim()).filter(Boolean)
        if (!list.length) { toast('Escribe al menos un tema del temario'); return }
        g.study.topics = list.map(t => ({ id: uid(), text: t, done: false }))
        g.fixed = true
      }
      if (sMode === 'libros') g.study.books = []
      if (sMode === 'libros' || sMode === 'horas') g.due = addMonths(12)
    }
    if (haveN > 0 && money$) g.contributions.push({ id: uid(), date: start, amount: Math.min(haveN, mine), note: 'Lo que ya tenía' })
    if (group && money$) g.group = { code: 'UGO-' + Math.random().toString(36).slice(2, 6).toUpperCase(), members: [{ id: uid(), name: profile.name || 'Tú', isMe: true, paid: 0, show: 'monto' }, ...people.filter(p => p.trim()).map(nm => ({ id: uid(), name: nm.trim(), paid: 0, show: 'pct' as const }))] }
    sessionStorage.removeItem('ugoal-own-photo')
    addGoal(g)
    go(`/meta/${id}`, { replace: true })
    burst(90); toast(isVice ? 'Hoy es el día uno. Tú puedes.' : 'Meta creada. Ahora a cumplirla.')
  }

  const dueChips: [string, string][] = [[addMonths(6), '6 meses'], [addMonths(12), '1 año'], [addMonths(24), '2 años'], [addMonths(36), '3 años']]

  return (
    <div className="screen" style={{ gap: 22 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back(`/nueva/${cat}`)} aria-label="Regresar"><ArrowLeft /></button><span className="t-sm">{meta.label}</span><span style={{ width: 42 }} /></div>
      <Photo src={photo} mode={mode} ratio={mode === 'cut' ? '16/11' : '16/12'}>
        {mode === 'full' && <h1 className="t-xl" style={{ position: 'absolute', left: 18, bottom: 14, right: 18 }}>{title || 'Tu meta'}</h1>}
      </Photo>

      {(!it || !fis) && (
        <div className="field"><label className="label" htmlFor="g-title">Nombre</label><input id="g-title" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder={isVice ? 'Ej. Dejar de fumar' : fis ? 'Ej. Ir al gym 30 días' : 'Ej. Mi primer coche'} maxLength={40} /></div>
      )}

      {fis && (
        <>
          <div className="col" style={{ gap: 8 }}>{it && <h1 className="t-xl">{it.name}</h1>}
            <p className="t-body">{fis.kind === 'plan' ? `Plan de ${(fis as PlanDef).weeks} semanas, ${(fis as PlanDef).make(0, (fis as PlanDef).weeks).length} entrenamientos por semana. Marca cada uno y registra tu avance.` : `Reto de ${fis.days} días. Marca cada día que cumplas.`}</p></div>
          {fis.kind === 'plan' && (
            <div className="field"><label className="label" htmlFor="g-base">{(fis as PlanDef).label} hoy ({(fis as PlanDef).unit})</label>
              <input id="g-base" className="input" inputMode="decimal" value={base} onChange={e => setBase(e.target.value.replace(/[^0-9.]/g, ''))} /></div>
          )}
        </>
      )}

      {isVice && (
        <>
          <div className="field"><span className="label">¿Cómo le quieres hacer?</span>
            <Seg value={vMode} onChange={setVMode} options={[['dejar', 'Dejarlo de golpe'], ['bajar', 'Poco a poco']]} />
            <p className="t-sm">{vMode === 'dejar' ? 'Contamos tus días limpio. Si recaes, empiezas de nuevo sin culpa y tu mejor marca se queda guardada.' : 'Te ponemos un límite diario que baja cada semana hasta llegar a cero. Tú anotas cuánto consumiste.'}</p>
          </div>
          {vMode === 'dejar' ? (
            <div className="field"><span className="label">¿Cuántos días limpio es tu meta?</span>
              <Chips value={vDays} onChange={setVDays} options={[[30, '30 días'], [90, '90 días'], [180, '6 meses'], [365, '1 año']]} /></div>
          ) : (
            <>
              <div className="field"><label className="label" htmlFor="v-per">¿Cuántos {vUnit} al día hoy?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input id="v-per" className="input" inputMode="decimal" value={vPer} onChange={e => setVPer(e.target.value.replace(/[^0-9.]/g, ''))} style={{ flex: 1, minWidth: 0 }} />
                  <input className="input" value={vUnit} onChange={e => setVUnit(e.target.value)} aria-label="Unidad" style={{ flex: 1.4, minWidth: 0 }} />
                </div></div>
              <div className="field"><span className="label">¿En cuánto tiempo llegas a cero?</span>
                <Chips value={vWeeks} onChange={setVWeeks} options={[[4, '4 semanas'], [6, '6 semanas'], [8, '8 semanas'], [12, '12 semanas']]} />
                <p className="t-sm">Esta semana tu límite es de <b style={{ color: 'var(--ink)' }}>{Math.max(0, Math.round(n(vPer) * (1 - 1 / vWeeks)))} {vUnit}</b> al día.</p></div>
            </>
          )}
        </>
      )}

      {isStudy && (
        <div className="field"><span className="label">¿Qué quieres medir?</span>
          <Seg value={sMode} onChange={setSMode} options={[['horas', 'Horas'], ['examen', 'Examen'], ['libros', 'Libros'], ['dinero', 'Pagarlo']]} />
          {sMode === 'horas' && <><p className="t-sm">Usa el temporizador de enfoque y cada sesión suma horas. ¿Cuántas horas te propones?</p><Chips value={hours} onChange={setHours} options={[[20, '20 h'], [50, '50 h'], [100, '100 h'], [200, '200 h']]} /></>}
          {sMode === 'libros' && <><p className="t-sm">¿Cuántos libros en los próximos 12 meses?</p><Chips value={books} onChange={setBooks} options={[[6, '6'], [12, '12'], [24, '24'], [52, '52']]} /></>}
          {sMode === 'examen' && (
            <>
              <p className="t-sm">Fecha del examen y temario. Un tema por renglón; los vas palomeando.</p>
              <input className="input" type="date" value={due} min={iso(new Date(today().getTime() + 7 * 86400000))} onChange={e => e.target.value && setDue(e.target.value)} aria-label="Fecha del examen" />
              <textarea className="input" value={topics} onChange={e => setTopics(e.target.value)} placeholder={'Álgebra\nComprensión lectora\nExamen de práctica'} style={{ minHeight: 130 }} aria-label="Temario" />
            </>
          )}
          {sMode === 'dinero' && <p className="t-sm">Juntar para pagar el curso o la colegiatura.</p>}
        </div>
      )}

      {money$ && (
        <>
          {hasParts ? (
            <div className="field"><span className="label">{isBiz ? 'Lo que necesitas para arrancar (ajústalo a tus cotizaciones)' : isTrip ? '¿Cuánto cuesta cada parte? (lo que encontraste)' : '¿Cuánto cuesta cada parte? (ajústalo)'}</span>
              <div className="card" style={{ padding: '4px 16px', gap: 0 }}>
                {partNames.map(p => (
                  <label key={p} className="li" style={{ justifyContent: 'space-between' }}><span>{p}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="t-sm">$</span>
                      <input inputMode="decimal" placeholder="0" value={parts[p] ?? ''} onChange={e => setParts(s => ({ ...s, [p]: typed(e.target.value) }))}
                        style={{ width: 110, textAlign: 'right', border: 0, background: 'transparent', outline: 'none', fontSize: 17, fontWeight: 600 }} aria-label={p} /></span>
                  </label>
                ))}
                <div className="li" style={{ justifyContent: 'space-between' }}><b>Total</b><b className="lime">{money(tripTotal)}</b></div>
              </div>
            </div>
          ) : isSnow ? (
            <div className="field"><span className="label">Tus deudas (pagas primero la más chica y vas por la siguiente)</span>
              {debts.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input className="input" style={{ height: 48, flex: 1.2, minWidth: 0 }} placeholder="¿Con quién?" value={d.name} onChange={e => setDebts(s => s.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input className="input" style={{ height: 48, flex: 1, minWidth: 0 }} inputMode="decimal" placeholder="$0" value={d.amount} onChange={e => setDebts(s => s.map((x, j) => (j === i ? { ...x, amount: typed(e.target.value) } : x)))} aria-label="Monto" />
                  {debts.length > 1 && <button className="iconbtn" style={{ width: 48, height: 48, flex: 'none' }} onClick={() => setDebts(s => s.filter((_, j) => j !== i))} aria-label="Quitar"><Minus /></button>}
                </div>
              ))}
              <button className="link" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setDebts(s => [...s, { name: '', amount: '' }])}><Plus size={16} /> Agregar deuda</button>
              {debtTotal > 0 && <p className="t-sm">Debes en total <b style={{ color: 'var(--ink)' }}>{money(debtTotal)}</b>.</p>}
            </div>
          ) : isFund ? (
            <div className="field"><span className="label">¿Cuánto gastas al mes? (renta, comida, transporte, servicios)</span>
              <label className="money-input"><span>$</span><input inputMode="decimal" placeholder="0" value={monthly} onChange={e => setMonthly(typed(e.target.value))} aria-label="Gasto mensual" /></label>
              {full > 0 && <p className="t-sm">Tu colchón: <b style={{ color: 'var(--ink)' }}>{money(full)}</b> ({fundMonths} meses de gastos). Es lo primero que te protege si algo sale mal.</p>}
            </div>
          ) : (
            <div className="field"><span className="label">{isDebt ? '¿Cuánto debes?' : it?.price ? 'Precio de referencia (cámbialo si encontraste otro)' : '¿Cuánto cuesta? (el precio que encontraste)'}</span>
              <label className="money-input"><span>$</span><input inputMode="decimal" placeholder="0" value={price} onChange={e => setPrice(typed(e.target.value))} aria-label="Precio" /></label>
            </div>
          )}

          {isSchool && (
            <div className="card" style={{ gap: 0, padding: '6px 18px' }}>
              <label className="li" style={{ gap: 12 }}><span className="t-sm" style={{ flex: 'none' }}>¿Para quién?</span><input className="input" style={{ height: 44, border: 0, background: 'transparent', padding: 0 }} placeholder="Para mí, mi hijo, mi hermana…" value={forWhom} onChange={e => setForWhom(e.target.value)} maxLength={24} /></label>
              <label className="li" style={{ justifyContent: 'space-between' }}>
                <span className="col" style={{ gap: 0 }}><b>Se repite cada semestre</b><span className="t-sm">Al cumplirla te armamos la del siguiente</span></span>
                <input type="checkbox" className="switch" checked={repeat} onChange={e => setRepeat(e.target.checked)} />
              </label>
            </div>
          )}

          {canCredit && (
            <div className="card" style={{ gap: 0, padding: '6px 18px' }}>
              <label className="li" style={{ justifyContent: 'space-between' }}>
                <span className="col" style={{ gap: 0 }}><b>Solo juntar el enganche</b><span className="t-sm">El resto a crédito</span></span>
                <input type="checkbox" className="switch" checked={credit} onChange={e => setCredit(e.target.checked)} />
              </label>
              {credit && (
                <div className="col" style={{ gap: 10, padding: '6px 0 14px' }}>
                  <span className="label">Enganche</span><Chips value={pct} onChange={setPct} options={[[10, '10%'], [20, '20%'], [30, '30%'], [40, '40%'], [50, '50%']]} />
                  <span className="label">Plazo</span><Chips value={months} onChange={setMonths} options={[[24, '24 meses'], [36, '36 meses'], [48, '48 meses'], [60, '60 meses'], [72, '72 meses']]} />
                  <label className="row" style={{ gap: 10 }}><span className="label">Tasa anual aproximada</span><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input className="input" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value.replace(/[^0-9.]/g, ''))} style={{ width: 80, height: 44, textAlign: 'right' }} aria-label="Tasa anual" />%</span></label>
                  {full > 0 && <p className="t-sm">Enganche de <b style={{ color: 'var(--ink)' }}>{money(total)}</b> y mensualidad aproximada de <b style={{ color: 'var(--ink)' }}>{money(creditPayment(creditDef))}</b> por {months} meses. Es una referencia; la agencia o el banco te dan la cifra exacta.</p>}
                </div>
              )}
            </div>
          )}

          <div className="field"><label className="label" htmlFor="g-have">¿Ya tienes algo apartado?</label>
            <input id="g-have" className="input" inputMode="decimal" placeholder="$0" value={have} onChange={e => setHave(typed(e.target.value))} /></div>
          <div className="field"><span className="label">{isTrip ? '¿Cuándo es el viaje?' : cat === 'eventos' ? '¿Cuándo es?' : isSchool ? '¿Cuándo hay que pagar?' : isDebt ? '¿Para cuándo quieres liquidar?' : '¿Para cuándo?'}</span>
            <Chips value={due} onChange={setDue} options={dueChips} />
            <input className="input" type="date" value={due} min={iso(new Date(today().getTime() + 14 * 86400000))} onChange={e => e.target.value && setDue(e.target.value)} aria-label="Fecha meta" />
            <label className="li" style={{ justifyContent: 'space-between', padding: '6px 2px' }}>
              <span className="col" style={{ gap: 0 }}><b>La fecha no se mueve</b><span className="t-sm">Es un evento (viaje, boda, regalo). Te avisamos si no llegas.</span></span>
              <input type="checkbox" className="switch" checked={fixed} onChange={e => setFixed(e.target.checked)} />
            </label>
          </div>
          {!credit && !isFund && !isDebt && (
            <div className="card" style={{ gap: 0, padding: '6px 18px' }}>
              <label className="li" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Users size={20} /><span className="col" style={{ gap: 0 }}><b>Meta en grupo</b><span className="t-sm">Con tu pareja, familia o amigos</span></span></span>
                <input type="checkbox" className="switch" checked={group} onChange={e => setGroup(e.target.checked)} />
              </label>
              {group && (
                <div className="col" style={{ gap: 8, padding: '6px 0 14px' }}>
                  <Seg value={flex ? 'flex' : 'igual'} onChange={v => setFlex(v === 'flex')} options={[['igual', 'Partes iguales'], ['flex', 'Lo que pueda cada quien']]} />
                  {flex && <p className="t-sm">Modo pareja o amigos: nadie tiene cuota fija; cada quien aporta lo que puede y entre todos llegan.</p>}
                  {people.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <input className="input" style={{ height: 48 }} placeholder={`Nombre de la persona ${i + 2}`} value={p} onChange={e => setPeople(s => s.map((x, j) => (j === i ? e.target.value : x)))} />
                      {people.length > 1 && <button className="iconbtn" style={{ width: 48, height: 48, flex: 'none' }} onClick={() => setPeople(s => s.filter((_, j) => j !== i))} aria-label="Quitar"><Minus /></button>}
                    </div>
                  ))}
                  <button className="link" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setPeople(s => [...s, ''])}><Plus size={16} /> Agregar persona</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="field"><label className="label" htmlFor="g-why">¿Por qué lo quieres? (te lo recordaremos)</label>
        <textarea id="g-why" className="input" value={why} onChange={e => setWhy(e.target.value)} placeholder={isVice ? 'Ej. Para respirar mejor y ver crecer a mis sobrinos.' : isStudy ? 'Ej. Para conseguir esa beca o ese trabajo.' : fis ? 'Ej. Para sentirme fuerte y con energía.' : 'Ej. Para dejar de pedir raite.'} maxLength={120} /></div>

      <div className="field"><label className="label" htmlFor="g-letter" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={13} /> Carta a tu yo del futuro (opcional)</label>
        <textarea id="g-letter" className="input" value={letter} onChange={e => setLetter(e.target.value)} placeholder="Escríbele a quien serás cuando lo logres. Queda sellada y solo se abre al cumplir la meta." maxLength={1200} style={{ minHeight: 110 }} /></div>

      {money$ && total > 0 && (
        <motion.div layout className="card" style={{ background: 'var(--lime-soft)', borderColor: 'transparent', gap: 6 }}>
          <span className="t-xs lime">Tu plan</span>
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.045em' }}>{money(per)}</span>
          <span className="t-body">cada {freqWord(profile.pay)}{profile.pay === 'variable' ? ' (júntalo como puedas)' : ''} · {periods} {freqPlural(profile.pay)} hasta el {fDate(due)}{members > 1 ? ` · tu parte de ${money(mine)}` : ''}</span>
        </motion.div>
      )}
      <button className="btn" onClick={save}>{isVice ? 'Empezar hoy' : 'Crear meta'}</button>
    </div>
  )
}
