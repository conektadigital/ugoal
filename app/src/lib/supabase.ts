/**
 * Conexión con Supabase (cuentas y respaldo en la nube).
 * Funciona en cuanto existan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env (ver SUPABASE.md).
 * Mientras no existan, la app guarda todo en el celular y estas funciones avisan que la cuenta no está conectada.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
export const cloudReady = !!supabase

const need = () => { if (!supabase) throw new Error('La cuenta todavía no está conectada.'); return supabase }

export const signUp = (email: string, password: string) => need().auth.signUp({ email, password })
export const signIn = (email: string, password: string) => need().auth.signInWithPassword({ email, password })
export const sendCode = (email: string) => need().auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
export const verifyCode = (email: string, token: string) => need().auth.verifyOtp({ email, token, type: 'email' })
export const signOut = () => need().auth.signOut()
export const currentUser = async () => (supabase ? (await supabase.auth.getUser()).data.user : null)

/** Sube todo el estado local a la tabla `snapshots` (una fila por usuario). */
export async function pushState(state: unknown) {
  const sb = need(); const user = await currentUser(); if (!user) throw new Error('Inicia sesión primero.')
  const { error } = await sb.from('snapshots').upsert({ user_id: user.id, data: state, updated_at: new Date().toISOString() })
  if (error) throw error
}
/** Baja el estado guardado en la nube, si existe. */
export async function pullState<T>(): Promise<T | null> {
  const sb = need(); const user = await currentUser(); if (!user) return null
  const { data, error } = await sb.from('snapshots').select('data').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return (data?.data as T) ?? null
}
