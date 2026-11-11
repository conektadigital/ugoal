import { AnimatePresence, motion } from 'framer-motion'
import { Compass, Home as HomeIcon, Plus, User, Users } from 'lucide-react'
import { useEffect } from 'react'
import { go, useRoute } from './router'
import { useStore } from './store'
import { Toaster, burst, toast } from './components/ui'
import { runNotices } from './lib/messages'
import { LockScreen } from './components/Lock'
import { useCloudSync } from './components/Auth'
import Badges, { BADGES, earned } from './screens/Badges'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Explore from './screens/Explore'
import NewGoal from './screens/NewGoal'
import GoalDetail from './screens/GoalDetail'
import Groups from './screens/Groups'
import Profile from './screens/Profile'
import TandaScreen from './screens/Tanda'
import Retos from './screens/Retos'
import Resumen from './screens/Resumen'
import CalendarScreen from './screens/Calendar'

function TabBar({ route }: { route: string }) {
  const tab = route.startsWith('/explorar') ? 'explorar' : route.startsWith('/grupos') ? 'grupos' : route.startsWith('/perfil') ? 'perfil' : 'inicio'
  const item = (key: string, path: string, label: string, Icon: typeof HomeIcon) => (
    <button className={`tab ${tab === key ? 'on' : ''}`} onClick={() => go(path)} aria-current={tab === key ? 'page' : undefined}>
      <Icon strokeWidth={tab === key ? 2.4 : 1.9} />
      {label}
      {tab === key && <motion.span layoutId="pip" className="pip" />}
    </button>
  )
  return (
    <nav className="tabbar" aria-label="Secciones">
      {item('inicio', '/', 'Inicio', HomeIcon)}
      {item('explorar', '/explorar', 'Explorar', Compass)}
      <motion.button className="tab-add" whileTap={{ scale: 0.9, rotate: 90 }} onClick={() => go('/nueva')} aria-label="Nueva meta"><Plus strokeWidth={2.6} /></motion.button>
      {item('grupos', '/grupos', 'Grupos', Users)}
      {item('perfil', '/perfil', 'Perfil', User)}
    </nav>
  )
}

export default function App() {
  const route = useRoute()
  useCloudSync()
  const { profile } = useStore()

  useEffect(() => {
    const dark = profile.theme === 'dark' || (profile.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#07080A' : '#F4F5F0')
  }, [profile.theme])

  // Avisos (frase del día, día de pago, racha en riesgo, logros y vicios) e insignias nuevas.
  const { goals, retos, tandas } = useStore()
  useEffect(() => {
    const check = () => {
      runNotices(profile, useStore.getState().goals, n => { toast(`${n.title} · ${n.body}`); burst(90) })
      const got = earned(useStore.getState())
      let seen: string[] | null = null
      try { seen = JSON.parse(localStorage.getItem('ugoal-badges') || 'null') } catch { /* nada */ }
      if (seen) {
        const fresh = got.filter(id => !seen!.includes(id))
        if (fresh.length) { const b = BADGES.find(x => x.id === fresh[0])!; setTimeout(() => { toast(`Nueva insignia: ${b.name}`); burst(120) }, 900) }
      }
      try { localStorage.setItem('ugoal-badges', JSON.stringify(got)) } catch { /* nada */ }
    }
    if (!profile.onboarded) return
    check()
    const vis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [profile, goals, retos, tandas])

  if (!profile.onboarded && !route.startsWith('/nueva')) return (<><Onboarding /><Toaster /><LockScreen /></>)

  const [, a, b, c] = route.split('/')
  let screen
  if (a === 'explorar') screen = <Explore cat={b} />
  else if (a === 'nueva') screen = <NewGoal cat={b} item={c} />
  else if (a === 'meta') screen = <GoalDetail id={b} />
  else if (a === 'grupos') screen = <Groups />
  else if (a === 'perfil') screen = <Profile />
  else if (a === 'tanda') screen = <TandaScreen id={b} />
  else if (a === 'retos') screen = <Retos id={b} />
  else if (a === 'resumen') screen = <Resumen prev={b === 'prev'} />
  else if (a === 'insignias') screen = <Badges />
  else if (a === 'calendario') screen = <CalendarScreen />
  else screen = <Home />
  const hideTabs = a === 'nueva' || a === 'meta' || a === 'tanda' || (a === 'retos' && !!b)

  return (
    <>
      <main className={`shell ${hideTabs ? 'bare' : ''}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={a + (b ?? '') + (c ?? '')} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            {screen}
          </motion.div>
        </AnimatePresence>
      </main>
      {!hideTabs && <TabBar route={route} />}
      <Toaster />
      <LockScreen />
    </>
  )
}
