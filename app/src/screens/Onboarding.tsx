import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { go } from '../router'
import { CATS, catArt } from '../data/categories'
import type { CatKey, PayFreq } from '../types'
import { LogoMark } from '../components/ui'
import { AuthSheet } from '../components/Auth'
import { InstallCard } from '../components/Install'
import { cloudReady } from '../lib/supabase'

const FREQS: { k: PayFreq; t: string; s: string }[] = [
  { k: 'quincenal', t: 'Cada quincena', s: 'El 15 y el último día del mes' },
  { k: 'semanal', t: 'Cada semana', s: 'Un pago por semana' },
  { k: 'mensual', t: 'Cada mes', s: 'Un pago al mes' },
  { k: 'variable', t: 'Variable', s: 'Sin fecha fija: propinas, ventas, por día. Te damos un monto por semana' },
]

export default function Onboarding() {
  const { profile, setProfile } = useStore()
  const [step, setStep] = useState(0)
  const [auth, setAuth] = useState<'login' | 'signup' | null>(null)
  const [name, setName] = useState(profile.name)
  const [pay, setPay] = useState<PayFreq>(profile.pay)
  const [ints, setInts] = useState<CatKey[]>(profile.interests)
  const next = () => setStep(s => s + 1)
  const finish = (to: string) => { setProfile({ name: name.trim(), pay, interests: ints, onboarded: true }); go(to, { replace: true }) }

  return (
    <main className="shell bare" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div className="topbar">
        {step > 0 ? <button className="iconbtn" onClick={() => setStep(s => s - 1)} aria-label="Regresar"><ArrowLeft /></button> : <span />}
        {step > 0 && (
          <div style={{ display: 'flex', gap: 6 }} aria-label={`Paso ${step} de 4`}>
            {[1, 2, 3, 4].map(i => <motion.span key={i} animate={{ width: i === step ? 22 : 6, background: i <= step ? 'var(--lime)' : 'var(--card-2)' }} style={{ height: 6, borderRadius: 9, display: 'block' }} />)}
          </div>
        )}
        <span style={{ width: 42 }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 12 }}>
          {step === 0 && (
            <>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                  style={{ width: 96, height: 96, borderRadius: 28, background: 'var(--card)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', boxShadow: '0 0 60px -10px var(--lime-glow)' }}>
                  <LogoMark size={60} />
                </motion.div>
                <div className="col" style={{ gap: 14 }}>
                  <motion.h1 className="t-hero" style={{ fontSize: 52 }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
                    Ponle fecha<br />a tus <span className="lime">sueños.</span>
                  </motion.h1>
                  <motion.p className="t-body" style={{ fontSize: 17 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    Elige lo que quieres, UGOAL te dice cuánto apartar cada vez que cobras, y tú cumples.
                  </motion.p>
                </div>
              </div>
              <motion.div className="col" style={{ gap: 10 }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
                <InstallCard compact />
                {cloudReady ? (
                  <>
                    <button className="btn" onClick={() => setAuth('signup')}>Crear mi cuenta <ArrowRight /></button>
                    <button className="btn ghost" onClick={() => setAuth('login')}>Ya tengo cuenta</button>
                    <button className="link" style={{ alignSelf: 'center', padding: 8 }} onClick={next}>Seguir sin cuenta</button>
                  </>
                ) : <button className="btn" onClick={next}>Empezar <ArrowRight /></button>}
              </motion.div>
              <AuthSheet open={!!auth} start={auth ?? 'login'} onClose={() => { const done = useStore.getState().profile.onboarded; setAuth(null); if (!done) next() }} />
            </>
          )}
          {step === 1 && (
            <>
              <div className="col" style={{ gap: 10 }}><h1 className="t-xl">¿Cómo te llamas?</h1><p className="t-body">Para hablarte por tu nombre.</p></div>
              <input className="input" style={{ height: 64, fontSize: 22, fontWeight: 600 }} placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={24} aria-label="Tu nombre"
                onKeyDown={e => e.key === 'Enter' && name.trim() && next()} />
              <div style={{ flex: 1 }} />
              <button className="btn" disabled={!name.trim()} onClick={next}>Continuar</button>
            </>
          )}
          {step === 2 && (
            <>
              <div className="col" style={{ gap: 10 }}><h1 className="t-xl">¿Cada cuándo cobras, {name.trim() || 'tú'}?</h1><p className="t-body">Con esto calculamos cuánto apartar en cada pago.</p></div>
              <div className="col" style={{ gap: 10 }}>
                {FREQS.map(f => (
                  <motion.button key={f.k} whileTap={{ scale: 0.98 }} onClick={() => setPay(f.k)} className="card"
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', borderColor: pay === f.k ? 'var(--lime)' : 'var(--line)' }}>
                    <span className="col"><b style={{ fontSize: 18 }}>{f.t}</b><span className="t-sm">{f.s}</span></span>
                    <span className={`check ${pay === f.k ? 'on' : ''}`} style={{ borderRadius: '50%' }}>{pay === f.k && <Check />}</span>
                  </motion.button>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={next}>Continuar</button>
            </>
          )}
          {step === 3 && (
            <>
              <div className="col" style={{ gap: 10 }}><h1 className="t-xl">¿Qué te mueve?</h1><p className="t-body">Elige todo lo que te interese. Puedes cambiarlo después.</p></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                {CATS.map((c, i) => {
                  const on = ints.includes(c.key)
                  return (
                    <motion.button key={c.key} className="glass interest" initial={{ opacity: 0, y: 16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 22 }} whileTap={{ scale: 0.92 }}
                      onClick={() => setInts(s => (on ? s.filter(x => x !== c.key) : [...s, c.key]))}
                      style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', aspectRatio: '1', outline: on ? '3px solid var(--lime)' : 'none', outlineOffset: -3 }}>
                      <motion.img src={catArt(c.key)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} animate={{ scale: on ? 1.12 : 1 }} transition={{ duration: 0.5 }} />
                      <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(7,8,10,.85))' }} />
                      <span style={{ position: 'absolute', left: 8, right: 8, bottom: 8, fontWeight: 700, fontSize: 12.5, lineHeight: 1.15, color: '#fff', textAlign: 'left' }}>{c.label}</span>
                      {on && <span className="check on" style={{ position: 'absolute', top: 6, right: 6, borderRadius: '50%', width: 20, height: 20 }}><Check /></span>}
                    </motion.button>
                  )
                })}
              </div>
              <button className="btn" disabled={!ints.length} onClick={next}>Continuar</button>
            </>
          )}
          {step === 4 && (
            <>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                <h1 className="t-xl">Listo, {name.trim()}.<br /><span className="lime">Ahora elige tu primer sueño.</span></h1>
                <p className="t-body">Escoge algo concreto: el coche, los tenis, el viaje. Ponle precio y fecha, y te decimos cuánto apartar cada {pay === 'semanal' || pay === 'variable' ? 'semana' : pay === 'quincenal' ? 'quincena' : 'mes'}.</p>
              </div>
              <div className="col" style={{ gap: 10 }}>
                <button className="btn" onClick={() => finish('/nueva')}>Crear mi primera meta</button>
                <button className="btn ghost" onClick={() => finish('/explorar')}>Primero quiero explorar</button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
