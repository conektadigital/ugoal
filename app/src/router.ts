import { useSyncExternalStore } from 'react'

const read = () => decodeURIComponent((location.hash || '#/').slice(1)) || '/'
const subscribe = (cb: () => void) => { addEventListener('hashchange', cb); return () => removeEventListener('hashchange', cb) }
export const useRoute = () => useSyncExternalStore(subscribe, read)

// Pila de navegación dentro de la app, para que "regresar" nunca saque al usuario de UGOAL.
const stack: string[] = []
addEventListener('hashchange', () => { if (stack.length && stack[stack.length - 1] === read()) stack.pop() })

export const go = (path: string, opts?: { replace?: boolean }) => {
  if (read() === path) return
  if (opts?.replace) history.replaceState(null, '', '#' + path)
  else { stack.push(read()); history.pushState(null, '', '#' + path) }
  dispatchEvent(new HashChangeEvent('hashchange'))
  scrollTo({ top: 0 })
}
export const back = (fallback = '/') => {
  if (stack.length) history.back()
  else go(fallback, { replace: true })
}
