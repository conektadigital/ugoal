import { BarChart3, Bell, CalendarDays, Lock, Cloud, Download, Flame, Target, Trophy, Upload } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { go } from '../router'
import { isMoney, payLabel, saved, streak } from '../lib/calc'
import { money } from '../lib/format'
import { DAILY, pick } from '../lib/phrases'
import { CATS } from '../data/categories'
import { cloudReady } from '../lib/supabase'
import { AuthSheet, logOut, useUserEmail } from '../components/Auth'
import { InstallCard } from '../components/Install'
import type { PayFreq } from '../types'
import { Logo, Sheet, toast } from '../components/ui'
import { PinPad, pinHash } from '../components/Lock'

export default function Profile() {
  const email = useUserEmail()
  const s = useStore()
  const { profile, goals, setProfile } = s
  const [confirm, setConfirm] = useState(false)
  const [auth, setAuth] = useState(false)
  const done = goals.filter(g => g.completedAt).length
  const total = goals.filter(isMoney).reduce((a, g) => a + saved(g), 0)
  const st = streak(goals)

  const notify = async (on: boolean) => {
    if (!on) { setProfile({ notify: false }); return }
    if (!('Notification' in window)) { toast('Tu navegador no permite avisos. En iPhone, primero agrega UGOAL a tu pantalla de inicio.'); return }
    const p = await Notification.requestPermission()
    if (p !== 'granted') { toast('No diste permiso para avisos.'); return }
    setProfile({ notify: true })
    try { new Notification('UGOAL', { body: pick(DAILY), icon: './icons/icon-192.png' }) } catch { /* algunos navegadores solo avisan desde la app instalada */ }
    toast('Avisos activados')
  }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile, goals, saved: s.saved, mainId: s.mainId }, null, 1)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ugoal-respaldo.json'; a.click()
  }
  const importData = async (f?: File) => {
    if (!f) return
    try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.goals)) throw 0; useStore.setState({ profile: d.profile, goals: d.goals, saved: d.saved ?? [], mainId: d.mainId }); toast('Respaldo cargado') }
    catch { toast('Ese archivo no es un respaldo de UGOAL') }
  }

  return (
    <div className="screen">
      <div className="topbar"><h1 className="t-xl">Perfil</h1></div>
      <section className="row" style={{ gap: 16, justifyContent: 'flex-start' }}>
        <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--lime)', color: 'var(--lime-ink)', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800 }}>{(profile.name || 'U')[0].toUpperCase()}</span>
        <div className="col" style={{ gap: 2 }}><b style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{profile.name || 'Tú'}</b><span className="t-sm">{payLabel(profile.pay)}</span></div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[[<Flame key="f" size={18} />, `${st}`, st === 1 ? 'semana seguida' : 'semanas seguidas'], [<Trophy key="t" size={18} />, `${done}`, done === 1 ? 'sueño cumplido' : 'sueños cumplidos'], [<span key="m" style={{ fontWeight: 800 }}>$</span>, money(total).replace('$', ''), 'apartado']].map(([i, v, l], k) => (
          <div key={k} className="card" style={{ padding: 14, gap: 6 }}><span className="lime">{i}</span><b style={{ fontSize: 20, letterSpacing: '-0.03em' }}>{v}</b><span className="t-sm" style={{ fontSize: 12 }}>{l}</span></div>
        ))}
      </section>

      <section className="col" style={{ gap: 8 }}>
        <h2 className="t-md">Ajustes</h2>
        <div className="field"><label className="label" htmlFor="p-name">Tu nombre</label><input id="p-name" className="input" value={profile.name} onChange={e => setProfile({ name: e.target.value })} maxLength={24} /></div>
        <div className="field"><span className="label">¿Cada cuándo cobras?</span>
          <div className="seg">{(['semanal', 'quincenal', 'mensual', 'variable'] as PayFreq[]).map(f => <button key={f} className={profile.pay === f ? 'on' : ''} onClick={() => setProfile({ pay: f })}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
          {profile.pay === 'variable' && <span className="t-sm">Te damos un monto por semana; júntalo como te vaya cayendo.</span>}</div>
        <div className="field"><span className="label">Tema</span>
          <div className="seg">{([['dark', 'Oscuro'], ['light', 'Claro'], ['system', 'Sistema']] as const).map(([k, l]) => <button key={k} className={profile.theme === k ? 'on' : ''} onClick={() => setProfile({ theme: k })}>{l}</button>)}</div></div>
        <div className="field"><span className="label">Lo que te interesa</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATS.map(c => { const on = profile.interests.includes(c.key); return <button key={c.key} className={`chip ${on ? 'lime' : ''}`} style={{ height: 36 }} onClick={() => setProfile({ interests: on ? profile.interests.filter(x => x !== c.key) : [...profile.interests, c.key] })}>{c.label}</button> })}
          </div></div>
        <button className="li" onClick={() => go('/resumen')}><BarChart3 size={20} /><span className="col" style={{ flex: 1, gap: 0, textAlign: 'left' }}><b>Mi avance</b><span className="t-sm">Resumen del mes y gráfica</span></span></button>
        <PinRow />
        <button className="li" onClick={() => go('/calendario')}><CalendarDays size={20} /><span className="col" style={{ flex: 1, gap: 0, textAlign: 'left' }}><b>Calendario</b><span className="t-sm">Días de pago, fechas y aportes</span></span></button>
        <button className="li" onClick={() => go('/insignias')}><Trophy size={20} /><span className="col" style={{ flex: 1, gap: 0, textAlign: 'left' }}><b>Insignias</b><span className="t-sm">Tus logros desbloqueados</span></span></button>
        <button className="li" onClick={() => go('/retos')}><Target size={20} /><span className="col" style={{ flex: 1, gap: 0, textAlign: 'left' }}><b>Retos de ahorro</b><span className="t-sm">52 semanas, 30 días, sobres</span></span></button>
        <label className="li" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Bell size={20} /><span className="col" style={{ gap: 0 }}><b>Recordatorios</b><span className="t-sm">Frase y cuánto apartar en tu día de pago</span></span></span>
          <input type="checkbox" className="switch" checked={profile.notify} onChange={e => notify(e.target.checked)} />
        </label>
      </section>

      <InstallCard />
      <section className="card">
        <div className="row" style={{ justifyContent: 'flex-start', gap: 12 }}><Cloud size={22} className="lime" /><b>Tu cuenta</b></div>
        {email ? (
          <>
            <p className="t-sm">Sesión iniciada como <b style={{ color: 'var(--ink)' }}>{email}</b>. Tus metas se respaldan solas.</p>
            <button className="btn ghost" onClick={logOut}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <p className="t-sm">{cloudReady ? 'Inicia sesión para respaldar tus metas y abrirlas en otro celular.' : 'Por ahora tus metas se guardan en este celular.'}</p>
            {cloudReady && <button className="btn" onClick={() => setAuth(true)}>Iniciar sesión o crear cuenta</button>}
          </>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <button className="btn ghost sm" style={{ width: '100%' }} onClick={exportData}><Download size={16} /> Respaldar</button>
          <label className="btn ghost sm" style={{ width: '100%', cursor: 'pointer' }}><Upload size={16} /> Restaurar<input type="file" accept="application/json" hidden onChange={e => importData(e.target.files?.[0])} /></label>
        </div>
      </section>

      <section className="col" style={{ gap: 10 }}>
        {confirm
          ? <button className="btn danger" onClick={() => { s.reset(); toast('Empezaste de cero') }}>Toca otra vez para borrar todo</button>
          : <button className="btn ghost" onClick={() => setConfirm(true)}>Borrar todos mis datos</button>}
        <div className="row" style={{ justifyContent: 'center', opacity: 0.6, marginTop: 10 }}><Logo size={18} /></div>
        <p className="t-sm" style={{ textAlign: 'center', fontSize: 11 }}>Fotos: Unsplash y Wikimedia Commons. Los precios los pone cada usuario.</p>
      </section>
      <AuthSheet open={auth} onClose={() => setAuth(false)} />
    </div>
  )
}

/** Activar o quitar el código de bloqueo (se pide dos veces para no equivocarse). */
function PinRow() {
  const { profile, setProfile } = useStore()
  const [open, setOpen] = useState(false)
  const [first, setFirst] = useState('')
  const [err, setErr] = useState(0)
  const done = async (pin: string) => {
    if (!first) { setFirst(pin); return }
    if (pin !== first) { setFirst(''); setErr(e => e + 1); toast('No coinciden. Otra vez.'); return }
    setProfile({ pin: await pinHash(pin) }); setOpen(false); setFirst(''); toast('Código activado')
  }
  return (
    <>
      <label className="li" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Lock size={20} /><span className="col" style={{ gap: 0 }}><b>Bloqueo con código</b><span className="t-sm">Pide 4 dígitos al abrir la app</span></span></span>
        <input type="checkbox" className="switch" checked={!!profile.pin} onChange={e => { if (e.target.checked) { setFirst(''); setOpen(true) } else { setProfile({ pin: undefined }); toast('Código quitado') } }} />
      </label>
      <Sheet open={open} onClose={() => { setOpen(false); setFirst('') }}>
        <PinPad title={first ? 'Confírmalo' : 'Crea tu código'} sub={first ? 'Escríbelo otra vez' : 'Si lo olvidas no se puede recuperar'} onDone={done} error={err} />
      </Sheet>
    </>
  )
}
