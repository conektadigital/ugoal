# UGOAL

App para ponerle fecha y precio a tus sueños: eliges qué quieres (coche, tenis, viaje, reto físico…), pones el precio que encontraste y la fecha, y UGOAL te dice cuánto apartar cada vez que cobras.

## Carpetas
- `app/` — la app (React + Vite). Se instala en el iPhone como app desde Safari (Compartir → Agregar a pantalla de inicio).
- `tools/` — scripts que arman el catálogo de ideas con fotos (Unsplash y Wikimedia Commons) y recortan el fondo de los productos.
- `SUPABASE.md` — guía para activar cuentas y respaldo en la nube.

## Comandos (dentro de `app/`)
- `npm run dev` — abre la app en tu compu (y en tu celular con la IP que muestra, si están en la misma red Wi-Fi).
- `npm run build` — compila la versión final en `app/dist`.

## Publicar en internet (cuando quieras)
1. Crea una cuenta gratuita en https://vercel.com y conecta este proyecto (o arrastra la carpeta `app/dist`).
2. Si ya conectaste Supabase, agrega las mismas dos variables de `.env` en Vercel → Settings → Environment Variables.

## Qué guarda y dónde
Mientras no conectes Supabase, todo vive en el navegador del celular. En **Perfil → Respaldar** puedes descargar un archivo con tus metas y en **Restaurar** volver a cargarlo.
