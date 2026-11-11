import { motion } from 'framer-motion'
import { Plus, RefreshCw, Users } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { go } from '../router'
import { groupSaved } from '../lib/calc'
import { money } from '../lib/format'
import { Bar, Photo, Press, toast } from '../components/ui'
import { newGoalPrefs } from './NewGoal'
import { currentRound, roundDate } from './Tanda'
import { fShort } from '../lib/format'

export default function Groups() {
  const { goals, tandas } = useStore()
  const [code, setCode] = useState('')
  const gs = goals.filter(g => g.group)
  return (
    <div className="screen">
      <div className="topbar"><h1 className="t-xl">Grupos</h1></div>
      <p className="t-body" style={{ marginTop: -10 }}>Un viaje con amigos, un regalo entre hermanos, el depa con tu pareja. La meta se divide en partes iguales y cada quien sabe cuánto le toca.</p>
      {gs.length ? gs.map((g, i) => (
        <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <Press onClick={() => go(`/meta/${g.id}`)} style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Photo src={g.photo} mode={g.photoMode} ratio="16/10">
              <span className="chip" style={{ position: 'absolute', top: 12, left: 12 }}><Users /> {g.group!.members.length} personas</span>
            </Photo>
            <div className="row"><b style={{ fontSize: 18 }}>{g.title}</b><b className="lime">{Math.round((groupSaved(g) / g.price) * 100)}%</b></div>
            <Bar value={groupSaved(g) / g.price} />
            <span className="t-sm">{money(g.price / g.group!.members.length)} por persona · entre todos llevan {money(groupSaved(g))}</span>
          </Press>
        </motion.div>
      )) : (
        <div className="card" style={{ alignItems: 'center', textAlign: 'center', padding: 28 }}>
          <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--lime-soft)', color: 'var(--lime-text)', display: 'grid', placeItems: 'center' }}><Users size={28} /></span>
          <b style={{ fontSize: 18 }}>Todavía no tienes metas en grupo</b>
          <p className="t-sm">Juntos se llega más rápido.</p>
        </div>
      )}
      <button className="btn" onClick={() => { newGoalPrefs.group = true; go('/nueva') }}><Plus /> Crear meta en grupo</button>
      <section className="col" style={{ gap: 10 }}>
        <div className="row"><h2 className="t-md">Tandas</h2><span className="t-sm">Todos ponen, uno recibe</span></div>
        {tandas.map(t => {
          const cur = currentRound(t), n = t.members.length
          return (
            <Press key={t.id} onClick={() => go(`/tanda/${t.id}`)} className="card" style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="row"><b style={{ fontSize: 17 }}>{t.name}</b><span className="chip"><RefreshCw /> {Math.min(cur + 1, n)}/{n}</span></div>
              <Bar value={cur / n} />
              <span className="t-sm">{cur >= n ? 'Terminada' : `Vuelta de ${money(t.amount * n)} para ${t.members[cur].isMe ? 'ti' : t.members[cur].name} · ${fShort(roundDate(t, cur))}`}</span>
            </Press>
          )
        })}
        <button className="btn ghost" onClick={() => go('/tanda/nueva')}><Plus /> Armar una tanda</button>
      </section>
      <section className="card">
        <b>¿Te invitaron?</b>
        <p className="t-sm">Escribe el código que te compartieron.</p>
        <form style={{ display: 'flex', gap: 8 }} onSubmit={e => { e.preventDefault(); toast(code.trim() ? 'Unirte con código estará disponible cuando conectes tu cuenta.' : 'Escribe el código') }}>
          <input className="input" style={{ height: 50, textTransform: 'uppercase' }} placeholder="UGO-XXXX" value={code} onChange={e => setCode(e.target.value)} aria-label="Código de invitación" />
          <button className="btn sm" style={{ height: 50 }}>Unirme</button>
        </form>
      </section>
    </div>
  )
}
