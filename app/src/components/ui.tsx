import { animate, motion, useMotionValue, useTransform, AnimatePresence, type PanInfo } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { ILLICIT, LOGOS, art, imgUrl, isIcon, isPh } from '../data/categories'

/* Vicios: foto real con zoom lento; las sustancias ilícitas llevan sello de prohibido. */
export function IconArt({ k }: { k: string; size?: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b0c0f' }}>
      <motion.img src={art(`v-${k}`)} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        animate={{ scale: [1.04, 1.12, 1.04] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,8,10,.15), rgba(7,8,10,.55))' }} />
      {ILLICIT.has(k) && <Prohibido />}
    </div>
  )
}
function Prohibido() {
  return (
    <motion.svg viewBox="0 0 100 100" style={{ position: 'absolute', left: '50%', top: '42%', width: '46%', translateX: '-50%', translateY: '-50%', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.55))' }}
      initial={{ scale: 1.6, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.2 }}>
      <circle cx="50" cy="50" r="42" fill="rgba(220,30,40,0.12)" stroke="#ff2d3d" strokeWidth="9" />
      <line x1="21" y1="79" x2="79" y2="21" stroke="#ff2d3d" strokeWidth="9" strokeLinecap="round" />
    </motion.svg>
  )
}

/** Logo oficial de una marca (Simple Icons o Wikimedia); si no hay, su nombre bien tipografiado. */
export function BrandLogo({ name, size = 56, mono }: { name: string; size?: number; mono?: string }) {
  const l = LOGOS[name]
  if (l?.path) return <svg viewBox="0 0 24 24" width={size} height={size} aria-label={name} role="img"><path d={l.path} fill={mono ?? (l.hex && l.hex !== '#000000' ? l.hex : '#111')} /></svg>
  if (l?.img) return <img src={`./logos/${l.img}`} alt={name} style={{ maxWidth: size * 2.2, maxHeight: size, objectFit: 'contain' }} />
  return <span style={{ fontWeight: 900, letterSpacing: '-0.04em', fontSize: size * 0.42, color: mono ?? '#111', textAlign: 'center', lineHeight: 1 }}>{name}</span>
}

/* Tarjeta de producto sin foto: logo grande de la marca sobre blanco. */
export function BrandArt({ src }: { src: string }) {
  const [, group] = src.slice(3).split('|')
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg, #ffffff 0%, #eceee9 100%)' }}>
      <BrandLogo name={group} size={72} />
    </div>
  )
}

/* ---------- Logo: una "U" que es un anillo de progreso abierto, con el punto lima de la meta alcanzada ---------- */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <motion.path d="M18 16v18a14 14 0 0 0 28 0V25" fill="none" stroke="var(--lime-mark)" strokeWidth="8.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }} />
      <motion.circle cx="46" cy="12" r="5.5" fill="var(--lime-mark)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.95, type: 'spring', stiffness: 400, damping: 14 }} />
    </svg>
  )
}
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} aria-label="UGOAL">
      <LogoMark size={size + 4} />
      <span style={{ fontWeight: 800, fontSize: size * 0.8, letterSpacing: '-0.04em' }}>UGOAL</span>
    </span>
  )
}

/* ---------- Número que cuenta ---------- */
export function CountUp({ value, format, duration = 1.1 }: { value: number; format: (n: number) => string; duration?: number }) {
  const mv = useMotionValue(0)
  const [txt, setTxt] = useState(format(0))
  useEffect(() => {
    const c = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: v => setTxt(format(v)) })
    return () => c.stop()
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span>{txt}</span>
}

/* ---------- Anillo de progreso ---------- */
export function Ring({ value, size = 120, stroke = 12, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-2)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--lime-mark)" strokeWidth={stroke} strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px var(--lime-glow))' }}
          initial={{ pathLength: 0 }} animate={{ pathLength: Math.max(0.001, Math.min(1, value)) }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  )
}

export function Bar({ value }: { value: number }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.i initial={{ width: 0 }} animate={{ width: `${Math.max(1.5, Math.min(100, value * 100))}%` }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  )
}

/* ---------- Foto: producto recortado sobre fondo limpio, o foto completa con degradado ---------- */
export function Photo({ src, mode, ratio = '4/3', shade = true, children, layoutId, style, reveal }: { src: string; mode: 'cut' | 'full'; ratio?: string; shade?: boolean; children?: ReactNode; layoutId?: string; style?: React.CSSProperties; reveal?: number }) {
  // "La foto se revela": empieza borrosa y en gris, y se aclara con tu avance. Al 100% queda nítida.
  const r = reveal === undefined ? 1 : Math.max(0, Math.min(1, reveal))
  const filter = r >= 1 ? undefined : `blur(${((1 - r) * 5).toFixed(1)}px) grayscale(${(1 - r).toFixed(2)}) brightness(${(0.8 + 0.2 * r).toFixed(2)})`
  return (
    <motion.div layoutId={layoutId} className={`photo ${mode === 'cut' ? 'product' : ''}`} style={{ aspectRatio: ratio, containerType: 'inline-size', ...style }}>
      {isIcon(src) ? <IconArt k={src.slice(5)} /> : isPh(src) ? <BrandArt src={src} /> : (
        <motion.img src={imgUrl(src)} alt="" initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: r < 1 ? 1.06 : 1, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} draggable={false}
          style={{ filter, transition: 'filter 1.2s ease' }} />
      )}
      {mode === 'full' && shade && !isIcon(src) && !isPh(src) && <div className="shade" />}
      {children}
    </motion.div>
  )
}

/* ---------- Hoja inferior arrastrable ---------- */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="sheet" role="dialog" aria-modal="true"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_e, i: PanInfo) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose() }}>
            <div className="grab" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ---------- Avisos ---------- */
const useToastStore = create<{ msg: string | null; key: number; show: (m: string) => void }>(set => ({
  msg: null, key: 0, show: m => set(s => ({ msg: m, key: s.key + 1 })),
}))
export const toast = (m: string) => useToastStore.getState().show(m)
export function Toaster() {
  const { msg, key } = useToastStore()
  const [vis, setVis] = useState(false)
  useEffect(() => { if (!msg) return; setVis(true); const t = setTimeout(() => setVis(false), 2800); return () => clearTimeout(t) }, [key, msg])
  return (
    <AnimatePresence>
      {vis && msg && (
        <motion.div key={key} className="toast" role="status" style={{ x: '-50%' }} initial={{ y: -30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }}>
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Confeti ---------- */
export function burst(n = 70) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cv = document.createElement('canvas')
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '95' })
  document.body.appendChild(cv)
  const dpr = devicePixelRatio || 1
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr
  const cx = cv.getContext('2d')!
  const cols = ['#C6FF3D', '#F4F6F1', '#9BE01A', '#E8FFB0', '#7CFF8A']
  const ps = Array.from({ length: n }, (_, i) => ({ x: innerWidth / 2, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 6, r: Math.random() * 7 + 4, c: cols[i % cols.length], a: Math.random() * 6, life: 0 }))
  const tick = () => {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight)
    let alive = 0
    for (const p of ps) {
      p.vy += 0.45; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.a += 0.2; p.life++
      if (p.y < innerHeight + 30 && p.life < 240) alive++
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cx.restore()
    }
    if (alive) requestAnimationFrame(tick); else cv.remove()
  }
  tick()
}

/* ---------- Tarjeta que se hunde al tocar ---------- */
export function Press({ children, onClick, className, style, label }: { children: ReactNode; onClick?: () => void; className?: string; style?: React.CSSProperties; label?: string }) {
  return (
    <motion.button type="button" className={className} style={style} onClick={onClick} aria-label={label} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 600, damping: 30 }}>
      {children}
    </motion.button>
  )
}

/* ---------- Inclinación sutil con el dedo (para la tarjeta principal) ---------- */
export function useTilt() {
  const x = useMotionValue(0), y = useMotionValue(0)
  const rx = useTransform(y, [-1, 1], [6, -6]), ry = useTransform(x, [-1, 1], [-6, 6])
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set(((e.clientX - r.left) / r.width) * 2 - 1); y.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  const onLeave = () => { animate(x, 0); animate(y, 0) }
  return { style: { rotateX: rx, rotateY: ry, transformPerspective: 900 }, onPointerMove: onMove, onPointerLeave: onLeave }
}
