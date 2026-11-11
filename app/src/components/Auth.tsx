import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { cloudReady, currentUser, pullState, pushState, sendCode, signIn, signOut, signUp, supabase, verifyCode } from '../lib/supabase'
import { Sheet, toast } from './ui'

type Snap = Record<string, unknown>
const snapshot = () => { const { profile, goals, mainId, saved, tandas, retos } = useStore.getState(); return { profile: { ...profile, pin: undefined }, goals, mainId, saved, tandas, retos, at: Date.now() } }

/** Al iniciar sesión: si la nube tiene datos, los trae; si no, sube los del celular. */
export async function syncAfterLogin() {
  const remote = await pullState<Snap>()
  if (remote && Array.isArray(remote.goals) && (remote.goals as unknown[]).length) {
    const pin = useStore.getState().profile.pin
    useStore.setState({ ...(remote as object), profile: { ...(remote.profile as object), pin, onboarded: true } } as never)
    toast('Tus metas se cargaron de tu cuenta')
  } else await pushState(snapshot())
}

/** Respaldo automático: cada cambio se sube a la cuenta (agrupado cada 4 s). */
export function useCloudSync() {
  useEffect(() => {
    if (!supabase) return
    let t: ReturnType<typeof setTimeout> | undefined
    const unsub = useStore.subscribe(() => {
      clearTimeout(t)
      t = setTimeout(async () => { if (await currentUser()) pushState(snapshot()).catch(() => { /* sin red: se reintenta en el siguiente cambio */ }) }, 4000)
    })
    return () => { unsub(); clearTimeout(t) }
  }, [])
}

export function useUserEmail() {
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => {
    if (!supabase) return
    currentUser().then(u => setEmail(u?.email ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return email
}

/** Formulario de cuenta: correo + contraseña, o código por correo. */
export function AuthForm({ start = 'login', onDone }: { start?: 'login' | 'signup'; onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'code'>(start)
  const [email, setEmail] = useState(''), [pass, setPass] = useState(''), [code, setCode] = useState('')
  const [sent, setSent] = useState(false), [busy, setBusy] = useState(false), [check, setCheck] = useState(false)
  if (!cloudReady) return <p className="t-sm">Las cuentas todavía no están conectadas en esta versión.</p>
  const run = async (fn: () => Promise<{ error: { message: string } | null; data?: { session?: unknown } }>, after: 'in' | 'mail' | 'code') => {
    if (!/\S+@\S+\.\S+/.test(email)) { toast('Escribe un correo válido'); return }
    setBusy(true)
    try {
      const r = await fn(); if (r.error) throw r.error
      if (after === 'in' || (after === 'mail' && r.data?.session)) { await syncAfterLogin(); toast('Sesión iniciada'); onDone() }
      else if (after === 'mail') setCheck(true)
      else { setSent(true); toast('Te mandamos un código a tu correo') }
    } catch (e) {
      const m = (e as Error).message || ''
      toast(/invalid login/i.test(m) ? 'Correo o contraseña incorrectos' : /registered/i.test(m) ? 'Ese correo ya tiene cuenta: inicia sesión' : /password/i.test(m) ? 'La contraseña debe tener al menos 8 caracteres' : 'No se pudo. Revisa tu conexión e intenta otra vez.')
    } finally { setBusy(false) }
  }
  if (check) return (
    <div className="col" style={{ gap: 10 }}>
      <h2 className="t-lg">Revisa tu correo</h2>
      <p className="t-body">Te mandamos un enlace a <b>{email}</b> para confirmar tu cuenta. Ábrelo y luego inicia sesión aquí.</p>
      <button className="btn" onClick={() => { setCheck(false); setMode('login') }}>Ya lo confirmé</button>
    </div>
  )
  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="seg">
        <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Entrar</button>
        <button className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Crear cuenta</button>
        <button className={mode === 'code' ? 'on' : ''} onClick={() => setMode('code')}>Con código</button>
      </div>
      <input className="input" type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value.trim())} aria-label="Correo" autoComplete="email" />
      {mode !== 'code' ? (
        <>
          <input className="input" type="password" placeholder="Contraseña (mínimo 8)" value={pass} onChange={e => setPass(e.target.value)} aria-label="Contraseña" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          {mode === 'login'
            ? <button className="btn" disabled={busy} onClick={() => run(() => signIn(email, pass), 'in')}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
            : <button className="btn" disabled={busy} onClick={() => pass.length < 8 ? toast('La contraseña debe tener al menos 8 caracteres') : run(() => signUp(email, pass), 'mail')}>{busy ? 'Creando…' : 'Crear mi cuenta'}</button>}
        </>
      ) : !sent ? (
        <button className="btn" disabled={busy} onClick={() => run(() => sendCode(email), 'code')}>{busy ? 'Enviando…' : 'Mandarme un código'}</button>
      ) : (
        <>
          <input className="input" inputMode="numeric" placeholder="Código de 6 dígitos" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Código" autoComplete="one-time-code" maxLength={8} />
          <button className="btn" disabled={busy} onClick={() => run(() => verifyCode(email, code), 'in')}>Entrar</button>
        </>
      )}
      <p className="t-sm">Tus metas se respaldan en tu cuenta y las puedes abrir en otro celular.</p>
    </div>
  )
}

export function AuthSheet({ open, onClose, start }: { open: boolean; onClose: () => void; start?: 'login' | 'signup' }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="t-lg">Tu cuenta UGOAL</h2>
      <AuthForm start={start} onDone={onClose} />
    </Sheet>
  )
}

export async function logOut() { try { await signOut(); toast('Sesión cerrada') } catch { /* nada */ } }
