import { motion, useAnimationControls } from 'framer-motion'
import { Delete } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Logo } from './ui'

/** Huella del código (no guardamos el código tal cual). */
export async function pinHash(pin: string) {
  const data = new TextEncoder().encode('ugoal:' + pin)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Teclado de 4 dígitos. */
export function PinPad({ title, sub, onDone, error }: { title: string; sub?: string; onDone: (pin: string) => void; error?: number }) {
  const [pin, setPin] = useState('')
  const shake = useAnimationControls()
  useEffect(() => { if (error) { setPin(''); shake.start({ x: [0, -14, 12, -8, 6, 0], transition: { duration: 0.4 } }); navigator.vibrate?.(120) } }, [error, shake])
  const press = (d: string) => {
    if (pin.length >= 4) return
    const n = pin + d
    setPin(n)
    if (n.length === 4) setTimeout(() => { onDone(n); setPin('') }, 120)
  }
  return (
    <div className="col" style={{ alignItems: 'center', gap: 26, width: '100%' }}>
      <div className="col" style={{ alignItems: 'center', gap: 6, textAlign: 'center' }}><h2 className="t-lg">{title}</h2>{sub && <p className="t-sm">{sub}</p>}</div>
      <motion.div animate={shake} style={{ display: 'flex', gap: 18 }}>
        {[0, 1, 2, 3].map(i => (
          <motion.span key={i} animate={{ scale: i < pin.length ? 1.15 : 1, background: i < pin.length ? 'var(--lime)' : 'rgba(0,0,0,0)' }}
            style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--lime-mark)' }} />
        ))}
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 76px)', gap: 16 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'].map((k, i) => k === '' ? <span key={i} /> : (
          <motion.button key={i} type="button" whileTap={{ scale: 0.88 }} className="glass" aria-label={k === '<' ? 'Borrar' : k}
            onClick={() => (k === '<' ? setPin(p => p.slice(0, -1)) : press(k))}
            style={{ width: 76, height: 76, borderRadius: '50%', fontSize: 28, fontWeight: 600, display: 'grid', placeItems: 'center' }}>
            {k === '<' ? <Delete size={24} /> : k}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/** Pantalla de bloqueo: aparece al abrir la app y al volver después de 1 minuto fuera. */
export function LockScreen() {
  const { profile, reset } = useStore()
  const [locked, setLocked] = useState(!!profile.pin)
  const [err, setErr] = useState(0)
  const [forgot, setForgot] = useState(false)
  useEffect(() => {
    if (!profile.pin) { setLocked(false); return }
    let hiddenAt = 0
    const vis = () => {
      if (document.visibilityState === 'hidden') hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > 60_000) setLocked(true)
    }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [profile.pin])
  if (!locked || !profile.pin) return null
  const check = async (pin: string) => { if ((await pinHash(pin)) === profile.pin) setLocked(false); else setErr(e => e + 1) }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34, padding: 24 }}>
      <Logo size={30} />
      {forgot ? (
        <div className="col" style={{ gap: 12, maxWidth: 340, textAlign: 'center' }}>
          <h2 className="t-lg">¿Olvidaste tu código?</h2>
          <p className="t-body">Por seguridad no se puede recuperar. Puedes borrar todo y empezar de nuevo (si hiciste un respaldo en Perfil, lo puedes cargar después).</p>
          <button className="btn danger" onClick={() => { reset(); setLocked(false) }}>Borrar todo y empezar de nuevo</button>
          <button className="btn ghost" onClick={() => setForgot(false)}>Intentar otra vez</button>
        </div>
      ) : (
        <>
          <PinPad title={`Hola${profile.name ? ', ' + profile.name : ''}`} sub="Escribe tu código" onDone={check} error={err} />
          {err >= 3 && <button className="link" onClick={() => setForgot(true)}>Olvidé mi código</button>}
        </>
      )}
    </div>
  )
}
