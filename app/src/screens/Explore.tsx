import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { go } from '../router'
import { CAT, CATALOG, CATALOG_COUNT, catArt, groupsOf, typesOf } from '../data/categories'
import type { CatalogItem, CatKey } from '../types'
import { money } from '../lib/format'
import { Photo, Press, Sheet } from '../components/ui'
import { Carousel, CategoryGrid } from './NewGoal'

export function ItemTile({ it, onOpen, i = 0 }: { it: CatalogItem; onOpen: () => void; i?: number }) {
  const { saved, toggleSaved } = useStore()
  const on = saved.includes(it.id)
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.035, ease: [0.16, 1, 0.3, 1], duration: 0.5 }} style={{ position: 'relative' }}>
      <Press onClick={onOpen} style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }} label={it.name}>
        <Photo src={it.img} mode={it.mode} ratio={it.mode === 'cut' ? '1/1' : '3/4'} />
        <span className="col" style={{ gap: 2, padding: '0 2px' }}>
          <b style={{ fontSize: 14, lineHeight: 1.2 }}>{it.name}</b>
          <span className="t-sm" style={{ fontSize: 12 }}>{it.group}{it.price ? ` · ${money(it.price)}` : ''}</span>
        </span>
      </Press>
      <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleSaved(it.id)} aria-pressed={on} aria-label={`Guardar ${it.name}`}
        className="chip glass" style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, padding: 0, justifyContent: 'center', color: on ? 'var(--lime)' : 'var(--ink)' }}>
        <Heart size={16} fill={on ? 'currentColor' : 'none'} />
      </motion.button>
    </motion.div>
  )
}

export function ItemSheet({ it, onClose }: { it: CatalogItem | null; onClose: () => void }) {
  const { saved, toggleSaved } = useStore()
  return (
    <Sheet open={!!it} onClose={onClose}>
      {it && (
        <>
          <Photo src={it.img} mode={it.mode} ratio={it.mode === 'cut' ? '4/3' : '4/3.2'} />
          <div className="col" style={{ gap: 6 }}>
            <p className="t-xs">{CAT[it.cat].label} · {it.group}</p>
            <h2 className="t-xl">{it.name}</h2>
            {it.price ? <p className="t-md">Desde <span className="lime">{money(it.price)}</span> <span className="t-sm">(precio de referencia)</span></p> : null}
            <p className="t-body">{it.cat === 'fisico' ? 'Incluye un plan semana a semana para que llegues.' : it.cat === 'vicios' ? 'Cuenta tus días limpio o bájale poco a poco.' : it.parts ? 'Trae un desglose sugerido que puedes ajustar.' : 'Te decimos cuánto apartar en cada pago para lograrlo.'}</p>
          </div>
          <button className="btn" onClick={() => { onClose(); go(`/nueva/${it.cat}/${it.id}`) }}>Hacerla mi meta</button>
          <button className="btn ghost" onClick={() => toggleSaved(it.id)}><Heart size={18} fill={saved.includes(it.id) ? 'currentColor' : 'none'} /> {saved.includes(it.id) ? 'Guardada' : 'Guardar para después'}</button>
        </>
      )}
    </Sheet>
  )
}

const BRANDED: CatKey[] = ['autos', 'tech', 'moda', 'casa', 'viajes']

export default function Explore({ cat }: { cat?: string }) {
  const { profile, saved } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<CatalogItem | null>(null)
  const meta = cat ? CAT[cat as CatKey] : undefined
  const types = meta ? typesOf(meta.key) : []
  const [type, setType] = useState<string | undefined>(undefined)
  const curType = type && types.some(t => t.key === type) ? type : types[0]?.key
  const t = q.trim().toLowerCase()
  const found = useMemo(() => (t ? CATALOG.filter(i => (!meta || i.cat === meta.key) && `${i.name} ${i.group} ${CAT[i.cat].label}`.toLowerCase().includes(t)).slice(0, 60) : []), [t, meta])
  const forYou = useMemo(() => {
    const cats = profile.interests.length ? profile.interests : (['autos', 'viajes', 'tech'] as CatKey[])
    return cats.flatMap(c => CATALOG.filter(i => i.cat === c && !i.img.startsWith('ph:')).slice(0, 4))
  }, [profile.interests])
  const savedItems = CATALOG.filter(i => saved.includes(i.id))

  return (
    <div className="screen" style={{ gap: 18 }}>
      {meta ? (
        <>
          <div className="topbar"><button className="iconbtn glass" onClick={() => go('/explorar', { replace: true })} aria-label="Todas las categorías"><ArrowLeft /></button><span /></div>
          <div className="row" style={{ justifyContent: 'flex-start', gap: 14 }}>
            <motion.img key={meta.key} src={catArt(meta.key)} alt="" style={{ width: 64, height: 64, borderRadius: 20, objectFit: 'cover' }} initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} />
            <div className="col" style={{ gap: 2 }}><h1 className="t-xl">{meta.label}</h1><p className="t-sm">{meta.hint}</p></div>
          </div>
        </>
      ) : (
        <div className="topbar"><h1 className="t-xl">Explorar</h1><span className="t-sm">{CATALOG_COUNT.toLocaleString('es-MX')} ideas</span></div>
      )}
      <label className="input glass" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Search size={18} color="var(--muted)" />
        <input style={{ border: 0, background: 'transparent', outline: 'none', flex: 1, minWidth: 0, fontSize: 16 }} placeholder={meta ? `Buscar en ${meta.short.toLowerCase()}` : 'Busca: Kia, Japón, Jordan, iPhone…'} value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar ideas" />
      </label>

      {t ? (
        found.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '18px 12px' }}>
            {found.map((it, i) => <ItemTile key={it.id} it={it} i={i} onOpen={() => setOpen(it)} />)}
          </div>
        ) : (
          <div className="empty">
            <p className="t-md" style={{ color: 'var(--ink)' }}>No encontramos eso.</p>
            <p className="t-sm" style={{ marginTop: 6 }}>Puedes crear tu meta con tu propia foto.</p>
            <button className="btn sm" style={{ marginTop: 16 }} onClick={() => go('/nueva')}>Crear meta</button>
          </div>
        )
      ) : meta ? (
        <>
          {types.length > 1 && (
            <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}>
              {types.map(x => (
                <button key={x.key} className={`pill ${curType === x.key ? 'on' : ''}`} onClick={() => setType(x.key)}>
                  {curType === x.key && <motion.span layoutId="ex-pill" className="pill-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}<span style={{ position: 'relative' }}>{x.label}</span>
                </button>
              ))}
            </div>
          )}
          {groupsOf(meta.key, BRANDED.includes(meta.key) ? curType : undefined).map(g => (
            <Carousel key={g.name} title={g.name} sub={`${g.items.length} ${g.items.length === 1 ? 'opción' : 'opciones'}`} items={g.items.slice(0, 10)} onPick={setOpen}
              onAll={g.items.length > 3 && BRANDED.includes(meta.key) ? () => go(`/nueva/${meta.key}/~${g.name}`) : undefined} />
          ))}
        </>
      ) : (
        <>
          {savedItems.length > 0 && <Carousel title="Guardadas" items={savedItems} onPick={setOpen} />}
          <Carousel title="Para ti" sub="Según lo que te interesa" items={forYou} onPick={setOpen} />
          <CategoryGrid onPick={k => go(`/explorar/${k}`)} />
        </>
      )}
      <ItemSheet it={open} onClose={() => setOpen(null)} />
    </div>
  )
}
