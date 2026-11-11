import { motion } from 'framer-motion'
import { ArrowLeft, Check, ChevronDown, Minus, Plus, Shuffle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { back, go } from '../router'
import type { Tanda } from '../types'
import { daysUntil, fDate, fShort, iso, money, parse, today, toNum, typed, uid } from '../lib/format'
import { Bar, burst, toast } from '../components/ui'
import { Seg } from './NewGoal'

/** Fecha de la vuelta i (0 = la primera). */
export function roundDate(t: Tanda, i: number) {
  const d = parse(t.start)
  if (t.freq === 'semanal') d.setDate(d.getDate() + 7 * i)
  else if (t.freq === 'mensual') d.setMonth(d.getMonth() + i)
  else for (let k = 0; k < i; k++) {
    if (d.getDate() < 15) d.setDate(15)
    else if (d.getDate() < new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()) d.setDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())
    else d.setMonth(d.getMonth() + 1, 15)
  }
  return iso(d)
}
/** Vuelta actual: la primera cuya fecha no ha pasado o que todavía tiene pagos pendientes. */
export function currentRound(t: Tanda) {
  const n = t.members.length
  for (let i = 0; i < n; i++) if (roundDate(t, i) >= iso(today()) || (t.paid[i]?.length ?? 0) < n) return i
  return n
}

export default function TandaScreen({ id }: { id?: string }) {
  if (id === 'nueva' || !id) return <NewTanda />
  return <TandaDetail id={id} />
}

function NewTanda() {
  const { profile, addTanda } = useStore()
  const [name, setName] = useState('Tanda con los amigos')
  const [amount, setAmount] = useState('')
  const [freq, setFreq] = useState<Tanda['freq']>('quincenal')
  const [start, setStart] = useState(iso(today()))
  const [people, setPeople] = useState<string[]>([profile.name || 'Yo', '', '', ''])
  const list = people.map(p => p.trim()).filter(Boolean)
  const amt = toNum(amount)
  const shuffle = () => setPeople(s => { const a = [...s]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a })
  const save = () => {
    if (!(amt > 0)) { toast('Escribe cuánto pone cada quien'); return }
    if (list.length < 2) { toast('Una tanda necesita al menos 2 personas'); return }
    const me = profile.name || 'Yo'
    const t: Tanda = { id: uid(), name: name.trim() || 'Tanda', amount: amt, freq, start, members: list.map(n => ({ id: uid(), name: n, isMe: n === me })), paid: {}, createdAt: iso(today()) }
    if (!t.members.some(m => m.isMe)) t.members[0].isMe = true
    addTanda(t); go(`/tanda/${t.id}`, { replace: true }); burst(70); toast('Tanda creada. Que nadie se raje.')
  }
  return (
    <div className="screen" style={{ gap: 20 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back('/grupos')} aria-label="Regresar"><ArrowLeft /></button><span /></div>
      <div className="col" style={{ gap: 8 }}><h1 className="t-xl">Nueva tanda</h1><p className="t-body">Todos ponen lo mismo cada vuelta y en cada vuelta a uno le toca recibir todo.</p></div>
      <div className="field"><label className="label" htmlFor="t-n">Nombre</label><input id="t-n" className="input" value={name} onChange={e => setName(e.target.value)} maxLength={30} /></div>
      <div className="field"><span className="label">¿Cuánto pone cada quien por vuelta?</span>
        <label className="money-input"><span>$</span><input inputMode="decimal" placeholder="0" value={amount} onChange={e => setAmount(typed(e.target.value))} aria-label="Monto por persona" /></label></div>
      <div className="field"><span className="label">¿Cada cuándo?</span><Seg value={freq} onChange={setFreq} options={[['semanal', 'Semanal'], ['quincenal', 'Quincenal'], ['mensual', 'Mensual']]} /></div>
      <div className="field"><label className="label" htmlFor="t-s">Primera vuelta</label><input id="t-s" type="date" className="input" value={start} onChange={e => e.target.value && setStart(e.target.value)} /></div>
      <div className="field">
        <div className="row"><span className="label">Participantes en orden de turno</span><button className="chip" onClick={shuffle}><Shuffle /> Sortear</button></div>
        {people.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 26, textAlign: 'center', fontWeight: 700, color: 'var(--muted)' }}>{i + 1}</span>
            <input className="input" style={{ height: 48 }} placeholder={`Persona ${i + 1}`} value={p} onChange={e => setPeople(s => s.map((x, j) => (j === i ? e.target.value : x)))} />
            {people.length > 2 && <button className="iconbtn" style={{ width: 48, height: 48, flex: 'none' }} onClick={() => setPeople(s => s.filter((_, j) => j !== i))} aria-label="Quitar"><Minus /></button>}
          </div>
        ))}
        <button className="link" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setPeople(s => [...s, ''])}><Plus size={16} /> Agregar persona</button>
      </div>
      {amt > 0 && list.length > 1 && (
        <div className="card" style={{ background: 'var(--lime-soft)', borderColor: 'transparent', gap: 4 }}>
          <span className="t-xs lime">Cada vuelta</span>
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em' }}>{money(amt * list.length)}</span>
          <span className="t-body">para quien le toque · {list.length} vueltas · termina el {fDate(roundDate({ start, freq } as Tanda, list.length - 1))}</span>
        </div>
      )}
      <button className="btn" onClick={save}>Crear tanda</button>
    </div>
  )
}

function TandaDetail({ id }: { id: string }) {
  const { tandas, updateTanda, removeTanda } = useStore()
  const t = tandas.find(x => x.id === id)
  const [openR, setOpenR] = useState<number | null>(null)
  const [del, setDel] = useState(false)
  if (!t) return <div className="screen"><div className="topbar"><button className="iconbtn" onClick={() => go('/grupos')} aria-label="Grupos"><ArrowLeft /></button></div><p className="empty">Esta tanda ya no existe.</p></div>
  const n = t.members.length, pot = t.amount * n
  const cur = currentRound(t)
  const meIdx = t.members.findIndex(m => m.isMe)
  const shown = openR ?? Math.min(cur, n - 1)
  const toggle = (r: number, mid: string) => updateTanda(t.id, x => {
    const l = x.paid[r] ?? []
    x.paid[r] = l.includes(mid) ? l.filter(y => y !== mid) : [...l, mid]
  })
  return (
    <div className="screen" style={{ gap: 20 }}>
      <div className="topbar"><button className="iconbtn" onClick={() => back('/grupos')} aria-label="Regresar"><ArrowLeft /></button><span className="t-sm">Tanda</span><span style={{ width: 42 }} /></div>
      <div className="col" style={{ gap: 6 }}>
        <h1 className="t-xl">{t.name}</h1>
        <p className="t-body">{money(t.amount)} por persona · {t.freq} · {n} personas</p>
      </div>
      <div className="card" style={{ gap: 6, background: 'var(--lime-soft)', borderColor: 'transparent' }}>
        {cur >= n ? <><span className="t-xs lime">Terminada</span><b style={{ fontSize: 22 }}>Todos recibieron. Tanda cumplida.</b></> : (
          <>
            <span className="t-xs lime">Vuelta {cur + 1} de {n} · {fShort(roundDate(t, cur))}</span>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.04em' }}>{money(pot)}</span>
            <span className="t-body">le toca a <b>{t.members[cur].isMe ? 'ti' : t.members[cur].name}</b></span>
            {meIdx >= 0 && meIdx !== cur && meIdx > cur && <span className="t-sm" style={{ color: 'var(--ink-2)' }}>Tú recibes el {fDate(roundDate(t, meIdx))} (faltan {Math.max(0, daysUntil(roundDate(t, meIdx)))} días).</span>}
          </>
        )}
      </div>

      <section className="col" style={{ gap: 6 }}>
        <h2 className="t-md">Vueltas</h2>
        <div className="list">
          {t.members.map((m, r) => {
            const paid = t.paid[r] ?? [], open = shown === r, full = paid.length === n
            return (
              <div key={m.id} className="col" style={{ gap: 0 }}>
                <button className="li" onClick={() => setOpenR(open ? -1 : r)} aria-expanded={open}>
                  <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 700, flex: 'none', background: r === cur ? 'var(--lime)' : full ? 'var(--lime-soft)' : 'var(--card-2)', color: r === cur ? 'var(--lime-ink)' : full ? 'var(--lime-text)' : 'var(--ink)' }}>{full ? <Check size={16} /> : r + 1}</span>
                  <span className="col" style={{ flex: 1, gap: 4, textAlign: 'left' }}>
                    <span className="row"><b>{m.isMe ? 'Tú' : m.name}</b><span className="t-sm">{fShort(roundDate(t, r))}</span></span>
                    <Bar value={paid.length / n} />
                  </span>
                  <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'var(--muted)' }} />
                </button>
                {open && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ padding: '4px 0 12px 46px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span className="t-sm" style={{ width: '100%' }}>¿Quién ya pagó esta vuelta? {paid.length}/{n} · {money(paid.length * t.amount)} de {money(pot)}</span>
                    {t.members.map(p => {
                      const on = paid.includes(p.id)
                      return <button key={p.id} className={`chip ${on ? 'lime' : ''}`} style={{ height: 36 }} onClick={() => { toggle(r, p.id); if (!on && paid.length + 1 === n) { burst(50); toast(`Vuelta completa. ${m.isMe ? 'Te toca cobrar.' : `Dale su dinero a ${m.name}.`}`) } }}>{on && <Check />}{p.isMe ? 'Yo' : p.name}</button>
                    })}
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
      </section>
      {del
        ? <button className="btn danger" onClick={() => { removeTanda(t.id); go('/grupos', { replace: true }); toast('Tanda borrada') }}><Trash2 size={18} /> Toca otra vez para borrar</button>
        : <button className="btn ghost" onClick={() => setDel(true)}>Borrar tanda</button>}
      <p className="t-sm">Por ahora tú llevas el registro. Cuando conectes tu cuenta, cada quien podrá marcar su pago desde su celular.</p>
    </div>
  )
}

