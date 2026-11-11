import { motion } from 'framer-motion'
import { Download, PlusSquare, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Sheet, toast } from './ui'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BIPEvent | null = null
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as BIPEvent })

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isInstalled = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
const KEY = 'ugoal-install-dismissed'

/** Tarjeta "Instala UGOAL en tu iPhone": pasos para agregarla a la pantalla de inicio desde Safari. */
export function InstallCard({ compact }: { compact?: boolean }) {
  const [hidden, setHidden] = useState(() => { try { return isInstalled() || localStorage.getItem(KEY) === '1' } catch { return isInstalled() } })
  const [open, setOpen] = useState(false)
  const [, force] = useState(0)
  useEffect(() => { const f = () => force(x => x + 1); addEventListener('beforeinstallprompt', f); return () => removeEventListener('beforeinstallprompt', f) }, [])
  if (hidden) return null
  const install = async () => {
    if (deferred) { await deferred.prompt(); const r = await deferred.userChoice; if (r.outcome === 'accepted') { setHidden(true); toast('¡Listo! Ya está en tu inicio.') } deferred = null; return }
    setOpen(true)
  }
  const dismiss = () => { setHidden(true); try { localStorage.setItem(KEY, '1') } catch { /* nada */ } }
  return (
    <>
      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: compact ? 12 : 16, position: 'relative' }}>
        <img src="./icons/icon-192.png" alt="" style={{ width: 48, height: 48, borderRadius: 12, flex: 'none' }} />
        <span className="col" style={{ flex: 1, gap: 2 }}>
          <b>Pon UGOAL en tu inicio</b>
          <span className="t-sm">Se abre como app, a pantalla completa y con avisos.</span>
        </span>
        <button className="btn sm" onClick={install}><Download size={16} /> Instalar</button>
        <button onClick={dismiss} aria-label="Cerrar" style={{ position: 'absolute', top: 6, right: 8, color: 'var(--muted)' }}><X size={14} /></button>
      </motion.div>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <h2 className="t-lg">Agrégala a tu iPhone</h2>
        {!isIOS() && <p className="t-sm">En tu computadora o Android, abre el menú del navegador y elige “Instalar app”.</p>}
        <div className="list">
          {[
            [<Share key="s" />, 'Abre este link en Safari', 'Debe ser Safari (la brújula azul). Si estás en otra app, toca “Abrir en Safari”.'],
            [<Share key="s2" />, 'Toca el botón Compartir', 'Es el cuadrito con la flecha hacia arriba, abajo en la pantalla.'],
            [<PlusSquare key="p" />, '“Agregar a pantalla de inicio”', 'Baja un poco en el menú hasta encontrarlo y toca “Agregar”.'],
          ].map(([ic, t, s], i) => (
            <div key={i} className="li" style={{ alignItems: 'flex-start' }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--lime-soft)', color: 'var(--lime-text)', display: 'grid', placeItems: 'center', flex: 'none' }}>{ic}</span>
              <span className="col" style={{ gap: 2 }}><b>{i + 1}. {t as string}</b><span className="t-sm">{s as string}</span></span>
            </div>
          ))}
        </div>
        <p className="t-sm">Listo: UGOAL aparece en tu pantalla con su ícono y se abre como cualquier app.</p>
        <button className="btn" onClick={() => setOpen(false)}>Entendido</button>
      </Sheet>
    </>
  )
}
