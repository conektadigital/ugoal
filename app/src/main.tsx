if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

// Modo app instalada: cachea la app para abrir sin conexión (solo en https o localhost).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !location.hostname.endsWith('claude.ai') && !location.hostname.includes('claudeusercontent')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
