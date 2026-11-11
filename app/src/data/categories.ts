import type { CatKey, CatalogItem, GoalKind } from '../types'
import autos from './cat/autos'
import tech from './cat/tech'
import moda from './cat/moda'
import viajes from './cat/viajes'
import { casa, deudas, escuela, estudios, eventos, finanzas, fisico, negocio, salud, vicios } from './cat/otros'
import photosRaw from './photos.json'

/** Fotos reales encontradas después (tools/cut_photos.py): id → archivo y modo. */
const PHOTOS = photosRaw as Record<string, { img: string; mode: 'cut' | 'full' }>

export type Area = 'cosas' | 'experiencias' | 'dinero' | 'tu'
export interface CatMeta {
  key: CatKey; label: string; short: string; kind: GoalKind | 'fisico'; mode: 'cut' | 'full'; hint: string
  icon: string // ícono 3D en /3d
  tone: string // color propio de la categoría
  area: Area
  groupLabel: string // "Marca", "Región", "Cuarto"…
}

export const CATS: CatMeta[] = [
  { key: 'autos', label: 'Coches y motos', short: 'Coches', kind: 'compra', mode: 'cut', hint: 'Del primero al de tus sueños', icon: 'autos', tone: '#ff6b5b', area: 'cosas', groupLabel: 'Marca' },
  { key: 'tech', label: 'Tecnología', short: 'Tech', kind: 'compra', mode: 'cut', hint: 'Celular, laptop, consola', icon: 'tech', tone: '#7aa7ff', area: 'cosas', groupLabel: 'Marca' },
  { key: 'moda', label: 'Moda', short: 'Moda', kind: 'compra', mode: 'cut', hint: 'Tenis, ropa, relojes', icon: 'moda', tone: '#ff8fd1', area: 'cosas', groupLabel: 'Marca' },
  { key: 'casa', label: 'Casa', short: 'Casa', kind: 'compra', mode: 'full', hint: 'Por cuarto o tu casa propia', icon: 'casa', tone: '#ffc861', area: 'cosas', groupLabel: 'Cuarto' },
  { key: 'viajes', label: 'Viajes', short: 'Viajes', kind: 'viaje', mode: 'full', hint: 'México y el mundo', icon: 'viajes', tone: '#5fd4ff', area: 'experiencias', groupLabel: 'Región' },
  { key: 'eventos', label: 'Eventos', short: 'Eventos', kind: 'compra', mode: 'full', hint: 'Boda, XV, cumpleaños', icon: 'eventos', tone: '#ffb35c', area: 'experiencias', groupLabel: 'Tipo' },
  { key: 'finanzas', label: 'Ahorro e inversión', short: 'Finanzas', kind: 'compra', mode: 'full', hint: 'Fondo, CETES, retiro', icon: 'finanzas', tone: '#c6ff3d', area: 'dinero', groupLabel: 'Tipo' },
  { key: 'deudas', label: 'Salir de deudas', short: 'Deudas', kind: 'compra', mode: 'full', hint: 'Tarjetas y préstamos', icon: 'deudas', tone: '#ff7a7a', area: 'dinero', groupLabel: 'Tipo' },
  { key: 'negocio', label: 'Emprender', short: 'Negocio', kind: 'compra', mode: 'full', hint: 'Tu propio negocio', icon: 'negocio', tone: '#7dffb2', area: 'dinero', groupLabel: 'Giro' },
  { key: 'escuela', label: 'Escuela', short: 'Escuela', kind: 'compra', mode: 'full', hint: 'Uni, prepa, hijos', icon: 'escuela', tone: '#b18cff', area: 'dinero', groupLabel: 'Nivel' },
  { key: 'fisico', label: 'Físico', short: 'Físico', kind: 'fisico', mode: 'full', hint: 'Correr, fuerza, bajar', icon: 'fisico', tone: '#ff9a3d', area: 'tu', groupLabel: 'Tipo' },
  { key: 'salud', label: 'Salud y belleza', short: 'Salud', kind: 'compra', mode: 'full', hint: 'Dentista, vista, estética', icon: 'salud', tone: '#ff6fae', area: 'tu', groupLabel: 'Tipo' },
  { key: 'estudios', label: 'Aprender', short: 'Aprender', kind: 'estudio', mode: 'full', hint: 'Idiomas, exámenes, libros', icon: 'estudios', tone: '#8ab4ff', area: 'tu', groupLabel: 'Tipo' },
  { key: 'vicios', label: 'Dejar un vicio', short: 'Vicios', kind: 'vicio', mode: 'full', hint: 'Cigarro, alcohol, redes', icon: 'vicios', tone: '#c08bff', area: 'tu', groupLabel: 'Tipo' },
]
export const AREAS: { key: Area; label: string }[] = [
  { key: 'cosas', label: 'Cosas que quieres' },
  { key: 'experiencias', label: 'Experiencias' },
  { key: 'dinero', label: 'Tu dinero' },
  { key: 'tu', label: 'Tú' },
]
export const CAT = Object.fromEntries(CATS.map(c => [c.key, c])) as Record<CatKey, CatMeta>
/** Foto real (categorías cat-*, insignias b-*, vicios v-*). */
export const art = (k: string) => `./art/${k}.webp`
export const catArt = (k: CatKey) => art(`cat-${k}`)
import logosRaw from './logos.json'
export const LOGOS = logosRaw as Record<string, { path?: string; hex?: string; img?: string; title: string }>

/** Vicios: cómo se cuenta y consumo típico al día. */
export const VICES: Record<string, { unit: string; per: number; mode: 'dejar' | 'bajar' }> = {
  cigarro: { unit: 'cigarros', per: 10, mode: 'dejar' },
  vape: { unit: 'veces', per: 20, mode: 'dejar' },
  alcohol: { unit: 'copas', per: 3, mode: 'dejar' },
  refresco: { unit: 'vasos', per: 3, mode: 'bajar' },
  azucar: { unit: 'dulces o postres', per: 3, mode: 'bajar' },
  apuestas: { unit: 'apuestas', per: 2, mode: 'dejar' },
  redes: { unit: 'horas', per: 5, mode: 'bajar' },
  chatarra: { unit: 'veces', per: 2, mode: 'bajar' },
  videojuegos: { unit: 'horas', per: 4, mode: 'bajar' },
  cafe: { unit: 'tazas', per: 4, mode: 'bajar' },
  compras: { unit: 'compras', per: 1, mode: 'dejar' },
  unas: { unit: 'veces', per: 10, mode: 'dejar' },
  series: { unit: 'horas', per: 3, mode: 'bajar' },
  'refresco-dieta': { unit: 'vasos', per: 2, mode: 'bajar' },
  domicilio: { unit: 'pedidos', per: 1, mode: 'bajar' },
  pan: { unit: 'piezas', per: 2, mode: 'bajar' },
  fines: { unit: 'copas', per: 4, mode: 'bajar' },
  mariguana: { unit: 'veces', per: 2, mode: 'dejar' },
  cocaina: { unit: 'veces', per: 1, mode: 'dejar' },
  cristal: { unit: 'veces', per: 1, mode: 'dejar' },
}
/** Sustancias ilícitas: llevan sello de prohibido sobre la foto. */
export const ILLICIT = new Set(['mariguana', 'cocaina', 'cristal'])

/* ---------- Lector del catálogo ---------- */
const BRANDED: CatKey[] = ['autos', 'tech', 'moda']
const SPLIT = new Set(['Dodge y RAM', 'Seiko y Citizen', 'Swatch y Tissot', 'TAG Heuer y Omega', 'Nike y Adidas', 'Ralph Lauren y Lacoste', "Stone Island y Arc'teryx", "Carhartt y Levi's",
  'JBL y Marshall', 'Beats y Sonos', 'Xiaomi y Huawei', 'TCL y Hisense', 'GoPro e Insta360', 'Acer y MSI', 'Xiaomi y Lenovo', 'Bajaj y TVS', 'Cadillac y Lincoln', 'Omoda y Jaecoo', 'Asics y Onitsuka', 'On y Hoka'])
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const seen = new Set<string>()
function parse(cat: CatKey, src: string): CatalogItem[] {
  const out: CatalogItem[] = []
  let type = cat as string, group = ''
  for (const raw of src.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#')) { type = line.slice(1).split(' ')[0]; continue }
    if (line.startsWith('@')) { group = line.slice(1).trim(); continue }
    const [name, price, img, id, parts] = line.split('|')
    // Grupos combinados ("Seiko y Citizen") se separan por marca según el nombre del modelo.
    let grp = group
    if (SPLIT.has(group)) {
      const opts = group.split(/ y | e /)
      grp = opts.find(o => (' ' + name.toLowerCase() + ' ').includes(' ' + o.toLowerCase() + ' ')) ?? opts[0]
    }
    let key = id || `${cat}-${slug(group)}-${slug(name)}`
    const groupName = grp
    while (seen.has(key)) key += '-2'
    seen.add(key)
    const found = !img ? PHOTOS[key] : undefined
    const hasImg = !!img
    out.push({
      id: key, cat, type, group: groupName, name: name.trim(),
      brand: groupName,
      price: price ? Number(price) || undefined : undefined,
      img: hasImg ? img : found ? found.img : `ph:${cat}|${group}`,
      mode: found ? found.mode : hasImg && BRANDED.includes(cat) && !img.startsWith('icon:') ? 'cut' : 'full',
      parts: parts ? parts.split(',').map(p => { const [n, a] = p.split(':'); return { name: n.trim(), amount: Number(a) } }) : undefined,
    })
  }
  return out
}
const ALL: CatalogItem[] = [
  ...parse('autos', autos), ...parse('tech', tech), ...parse('moda', moda), ...parse('viajes', viajes), ...parse('casa', casa),
  ...parse('eventos', eventos), ...parse('finanzas', finanzas), ...parse('deudas', deudas), ...parse('negocio', negocio), ...parse('escuela', escuela),
  ...parse('fisico', fisico), ...parse('salud', salud), ...parse('estudios', estudios), ...parse('vicios', vicios),
]
/** Solo se muestran ideas con foto real verificada: sin tarjetas en blanco ni fotos que no correspondan. */
export const CATALOG: CatalogItem[] = ALL.filter(i => !i.img.startsWith('ph:'))
export const HIDDEN = ALL.filter(i => i.img.startsWith('ph:'))
export const ITEM = Object.fromEntries(ALL.map(i => [i.id, i])) as Record<string, CatalogItem>
export const byCat = (k: CatKey) => CATALOG.filter(i => i.cat === k)
/** Tipos de una categoría, en orden, con su etiqueta. */
const TYPE_LABELS: Record<string, string> = {}
for (const s of [autos, tech, moda, viajes, casa]) for (const l of s.split('\n')) if (l.startsWith('#')) { const [k, ...r] = l.slice(1).split(' '); TYPE_LABELS[k] = r.join(' ') }
export const typesOf = (k: CatKey) => [...new Set(byCat(k).map(i => i.type))].map(t => ({ key: t, label: TYPE_LABELS[t] ?? t }))
export const groupsOf = (k: CatKey, type?: string) => {
  const items = byCat(k).filter(i => !type || i.type === type)
  return [...new Set(items.map(i => i.group))].map(g => ({ name: g, items: items.filter(i => i.group === g) }))
}
/** Título de meta: en marcas se antepone la marca ("Kia K4 Hatchback") salvo que ya la traiga o sea un grupo genérico. */
export const itemTitle = (i: CatalogItem) => (BRANDED.includes(i.cat) && !/ y |armada|Setup|Lujo|Jerseys|Lentes|Perfumes|Bolsas|Joyería/.test(i.group) && !i.name.toLowerCase().includes(i.group.toLowerCase().split(' ')[0]) ? `${i.group} ${i.name}` : i.name)
export const imgUrl = (p: string) => (p.startsWith('data:') ? p : `./catalog/${p}`)
export const isIcon = (p: string) => p.startsWith('icon:')
export const isPh = (p: string) => p.startsWith('ph:')
export const CATALOG_COUNT = CATALOG.length
