import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' para que la app funcione en cualquier carpeta o link (Vercel, vista privada, etc.)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true, port: 5173 },
})
