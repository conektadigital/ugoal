# Conectar la cuenta de UGOAL (Supabase)

Hoy la app guarda todo en el celular. Al seguir estos pasos se activan las cuentas (correo y contraseña, o código por correo) y el respaldo en la nube. Toma unos 10 minutos y es gratis.

## 1. Crear el proyecto
1. Entra a https://supabase.com y crea una cuenta gratuita.
2. Da clic en **New project**. Nombre: `ugoal`. Región: la más cercana (por ejemplo, *East US*).
3. Guarda la contraseña de la base de datos en un lugar seguro.

## 2. Crear la tabla
1. En el menú izquierdo abre **SQL Editor**, luego **New query**.
2. Copia y pega todo el contenido de `supabase/schema.sql` y da clic en **Run**.

## 3. Activar el inicio de sesión
1. Ve a **Authentication → Sign In / Providers → Email** y deja activado *Email*.
2. Para el código por correo no hay que hacer nada más: Supabase lo envía solo.

## 4. Pegar las dos claves en la app
1. Ve a **Project Settings → API**.
2. Copia **Project URL** y **anon public key**.
3. En la carpeta `app`, copia el archivo `.env.example` con el nombre `.env` y pega ahí las dos claves:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

4. Vuelve a compilar la app (`npm run build`) o pídeselo a Claude.

Listo: en **Perfil → Tu cuenta** aparecerá *Iniciar sesión o crear cuenta*.

> La clave *anon* es pública por diseño; los datos quedan protegidos por las reglas de seguridad de `schema.sql` (cada quien solo ve lo suyo). Nunca pegues la clave *service_role* en la app.
