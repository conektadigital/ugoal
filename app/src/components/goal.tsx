import { AnimatePresence, motion } from 'framer-motion'
import { Share2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Contribution, Goal } from '../types'
import { useStore } from '../store'
import { freqWord, pace } from '../lib/calc'
import { iso, money, today, typed } from '../lib/format'
import { AFTER_SAVE, pick } from '../lib/phrases'
import { CAT, imgUrl, isIcon, isPh } from '../data/categories'
import { BrandArt, IconArt, Sheet, burst, toast } from './ui'

/* ---------- Registrar o editar un aporte ---------- */
export function ContributionSheet({ goal, open, onClose, edit, onCompleted }: { goal: Goal; open: boolean; onClose: () => void; edit?: Contribution; onCompleted?: () => void }) {
  const { profile, addContribution, editContribution, removeContribution } = useStore()
  const p = pace(goal, profile.pay)
  const [amt, setAmt] = useState('')
  const [note, setNote] = useState('')
  const [part, setPart] = useState('')
  const [date, setDate] = useState(iso(today()))
  const [confirmDel, setConfirmDel] = useState(false)
  useEffect(() => {
    if (!open) return
    setAmt(edit ? typed(String(edit.amount)) : ''); setNote(edit?.note ?? ''); setPart(edit?.partId ?? goal.parts?.[0]?.id ?? ''); setDate(edit?.date ?? iso(today())); setConfirmDel(false)
  }, [open, edit, goal.parts])

  const save = () => {
    const amount = parseFloat(amt.replace(/,/g, ''))
    if (!(amount > 0)) { toast('Escribe cuánto apartaste'); return }
    if (edit) { editContribution(goal.id, { ...edit, amount, note: note.trim() || undefined, partId: part || undefined, date }); onClose(); toast('Aporte actualizado'); return }
    const { completed } = addContribution(goal.id, { amount, note: note.trim() || undefined, partId: part || undefined, date })
    onClose()
    if (completed) { onCompleted?.(); return }
    burst(40); toast(pick(AFTER_SAVE))
  }
  const quick = [Math.ceil(p.per / 10) * 10, 500, 1000, 2000].filter((v, i, a) => v > 0 && a.indexOf(v) === i)

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="row"><h2 className="t-lg">{edit ? 'Editar aporte' : 'Aparté'}</h2><span className="t-sm">{goal.title}</span></div>
      <label className="money-input"><span>$</span><input inputMode="decimal" placeholder="0" value={amt} onChange={e => setAmt(typed(e.target.value))} autoFocus aria-label="Monto" /></label>
      {!edit && (
        <div className="row no-scrollbar" style={{ justifyContent: 'flex-start', gap: 8, overflowX: 'auto' }}>
          {quick.map((v, i) => (
            <button key={v} className="chip" style={{ flex: 'none', height: 36 }} onClick={() => setAmt(typed(String(v)))}>{i === 0 ? `Lo de esta ${freqWord(profile.pay)} · ${money(v)}` : money(v)}</button>
          ))}
        </div>
      )}
      {goal.parts && (
        <div className="field"><span className="label">¿Para qué parte del viaje?</span>
          <div className="row no-scrollbar" style={{ justifyContent: 'flex-start', gap: 8, overflowX: 'auto' }}>
            {goal.parts.map(x => <button key={x.id} className={`chip ${part === x.id ? 'lime' : ''}`} style={{ flex: 'none', height: 36 }} onClick={() => setPart(x.id)}>{x.name}</button>)}
          </div>
        </div>
      )}
      <div className="field"><label className="label" htmlFor="c-note">Nota (opcional)</label><input id="c-note" className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Quincena, venta, bono…" maxLength={40} /></div>
      {edit && <div className="field"><label className="label" htmlFor="c-date">Fecha</label><input id="c-date" type="date" className="input" value={date} max={iso(today())} onChange={e => setDate(e.target.value)} /></div>}
      <button className="btn" onClick={save}>{edit ? 'Guardar cambios' : 'Guardar aporte'}</button>
      {edit && (confirmDel
        ? <button className="btn danger" onClick={() => { removeContribution(goal.id, edit.id); onClose(); toast('Aporte borrado') }}>Toca otra vez para borrar</button>
        : <button className="btn ghost" onClick={() => setConfirmDel(true)}>Borrar aporte</button>)}
    </Sheet>
  )
}

/* ---------- Historia para Instagram (1080 × 1920) ---------- */
const STORY_LINES = ['Paso a paso, sin excusas.', 'Lo dije, lo estoy haciendo.', 'Cada peso cuenta.', 'Ya falta menos.', 'Disciplina > motivación.']
export async function shareGoal(goal: Goal, pct: number) {
  const W = 1080, H = 1920
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const c = cv.getContext('2d')!
  const font = (w: number, px: number) => `${w} ${px}px -apple-system, "SF Pro Display", "Segoe UI", sans-serif`
  c.fillStyle = '#07080A'; c.fillRect(0, 0, W, H)
  const src = goal.photo.startsWith('icon:') ? `./art/v-${goal.photo.slice(5)}.webp` : goal.photo.startsWith('ph:') ? '' : imgUrl(goal.photo)
  const img = new Image(); if (src) img.src = src
  if (src) await new Promise(r => { img.onload = r; img.onerror = r })
  if (img.naturalWidth) {
    if (goal.photoMode === 'cut') {
      const g = c.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.4, W * 0.9); g.addColorStop(0, '#2a2f36'); g.addColorStop(1, '#07080A')
      c.fillStyle = g; c.fillRect(0, 0, W, H)
      const s = Math.min((W * 0.9) / img.naturalWidth, (H * 0.42) / img.naturalHeight)
      c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 60; c.shadowOffsetY = 40
      c.drawImage(img, (W - img.naturalWidth * s) / 2, H * 0.4 - (img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s)
      c.shadowColor = 'transparent'
    } else {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight)
      c.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s)
    }
  }
  let g = c.createLinearGradient(0, H * 0.45, 0, H); g.addColorStop(0, 'rgba(7,8,10,0)'); g.addColorStop(0.55, 'rgba(7,8,10,.85)'); g.addColorStop(1, '#07080A')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  g = c.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, 'rgba(7,8,10,.7)'); g.addColorStop(1, 'rgba(7,8,10,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 360)
  // logo
  c.strokeStyle = '#C6FF3D'; c.lineWidth = 16; c.lineCap = 'round'
  c.beginPath(); c.moveTo(92, 120); c.lineTo(92, 168); c.arc(124, 168, 32, Math.PI, 0, true); c.lineTo(156, 146); c.stroke()
  c.fillStyle = '#C6FF3D'; c.beginPath(); c.arc(156, 112, 11, 0, Math.PI * 2); c.fill()
  c.fillStyle = '#F4F6F1'; c.font = font(800, 54); c.fillText('UGOAL', 196, 175)
  // anillo de avance
  const cx = 230, cy = H - 560, r = 130
  c.lineWidth = 30; c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke()
  c.strokeStyle = '#C6FF3D'; c.shadowColor = 'rgba(198,255,61,.6)'; c.shadowBlur = 30
  c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.01, Math.min(1, pct))); c.stroke(); c.shadowBlur = 0
  c.fillStyle = '#F4F6F1'; c.font = font(800, 76); c.textAlign = 'center'; c.fillText(`${Math.round(pct * 100)}%`, cx, cy + 26); c.textAlign = 'left'
  c.fillStyle = '#C6FF3D'; c.font = font(700, 40); c.fillText(pct >= 1 ? '¡LO LOGRÉ!' : 'VOY EN CAMINO', 410, cy - 50)
  c.fillStyle = '#F4F6F1'; c.font = font(800, 74)
  const words = goal.title.split(' '); let line = '', y = cy + 40
  for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > W - 480 && line) { c.fillText(line, 410, y); line = w; y += 82 } else line = t }
  c.fillText(line, 410, y)
  c.fillStyle = '#C9CDC6'; c.font = font(500, 44); c.fillText(STORY_LINES[Math.floor(Math.random() * STORY_LINES.length)], 92, H - 250)
  c.fillStyle = '#868B92'; c.font = font(500, 34); c.fillText(CAT[goal.cat].label + ' · hecho con UGOAL', 92, H - 180)
  const blob: Blob | null = await new Promise(r => cv.toBlob(r, 'image/png'))
  if (!blob) return
  const file = new File([blob], 'ugoal-historia.png', { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  try {
    if (nav.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'UGOAL' }); return }
  } catch { return }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ugoal-historia.png'; a.click()
  toast('Imagen lista: súbela a tus historias')
}

/* ---------- Celebración a pantalla completa ---------- */
export function Celebration({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  useEffect(() => { if (goal) { burst(160); const t = setTimeout(() => burst(90), 700); return () => clearTimeout(t) } }, [goal])
  return (
    <AnimatePresence>
      {goal && (
        <motion.div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#07080A', color: '#F4F6F1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {isIcon(goal.photo) ? <div style={{ position: 'absolute', inset: '0 0 35%' }}><IconArt k={goal.photo.slice(5)} size={0.5} /></div> : isPh(goal.photo) ? <div style={{ position: 'absolute', inset: '0 0 35%' }}><BrandArt src={goal.photo} /></div> : <motion.img src={imgUrl(goal.photo)} alt="" initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', inset: goal.photoMode === 'cut' ? '10% 8% 40%' : 0, width: goal.photoMode === 'cut' ? '84%' : '100%', height: goal.photoMode === 'cut' ? '50%' : '100%', objectFit: goal.photoMode === 'cut' ? 'contain' : 'cover', opacity: goal.photoMode === 'cut' ? 1 : 0.75 }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,8,10,0) 35%, #07080A 82%)' }} />
          <button className="iconbtn" onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: 'calc(var(--safe-top) + 14px)', right: 20, zIndex: 2 }}><X /></button>
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 480, width: '100%', margin: '0 auto', padding: '0 24px calc(var(--safe-bottom) + 32px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <motion.p className="t-xs" style={{ color: '#C6FF3D' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>Sueño cumplido</motion.p>
            <motion.h1 className="t-hero" style={{ fontSize: 64 }} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45, type: 'spring', stiffness: 200, damping: 18 }}>Lo lograste.</motion.h1>
            <motion.p className="t-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>{goal.title}</motion.p>
            {goal.letter ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} style={{ background: 'rgba(198,255,61,0.08)', border: '1px solid rgba(198,255,61,0.25)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '32vh', overflowY: 'auto' }}>
                <span className="t-xs" style={{ color: '#C6FF3D' }}>Tu carta del {new Date(goal.createdAt + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <p style={{ color: '#F4F6F1', fontSize: 16, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{goal.letter}</p>
              </motion.div>
            ) : <motion.p className="t-body" style={{ color: '#C9CDC6' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>Lo dijiste, lo apartaste, lo cumpliste. Ahora ve por el siguiente.</motion.p>}
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button className="btn" onClick={() => shareGoal(goal, 1)}><Share2 /> Subirlo a mis historias</button>
              <button className="btn ghost" style={{ background: 'rgba(255,255,255,0.08)', color: '#F4F6F1' }} onClick={onClose}>Seguir</button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
