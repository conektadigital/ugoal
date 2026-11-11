// Service worker sencillo: red primero, caché como respaldo para abrir sin conexión.
const CACHE = 'ugoal-v3'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone()
      caches.open(CACHE).then(c => c.put(req, copy))
      return res
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  )
})
