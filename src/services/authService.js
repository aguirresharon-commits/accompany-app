/**
 * Auth vía backend (API + JWT). Sin Firebase.
 */
import { API_BASE, apiFetch } from '../api/client.js'
import { activatePremium, deactivatePremium } from './premiumService'

const AUTH_KEY = 'control-app-auth'
const listeners = new Set()

function getStored() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage?.getItem(AUTH_KEY) : null
    if (!raw) return null
    const p = JSON.parse(raw)
    return p?.user && p?.token ? p : null
  } catch {
    return null
  }
}

function setStored(payload) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    if (payload) {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
    } else {
      window.localStorage.removeItem(AUTH_KEY)
    }
  } catch (e) {
    console.warn('authService: no se pudo persistir', e)
  }
}

function notify(user) {
  listeners.forEach((cb) => { try { cb(user) } catch (_) {} })
}

/**
 * Usuario actual { uid, email }. uid = id del backend.
 */
export function getCurrentUser() {
  const s = getStored()
  if (!s?.user) return null
  return { uid: s.user.id, email: s.user.email ?? null }
}

/**
 * Login con email y contraseña.
 */
export async function login(email, password) {
  const trimEmail = String(email ?? '').trim().toLowerCase()
  if (!trimEmail || !password) throw new Error('Email y contraseña son requeridos.')

  const { ok, status, data } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: trimEmail, password })
  })

  if (!ok) {
    throw new Error(data?.error || 'Email o contraseña incorrectos.')
  }

  const token = data?.token
  const user = data?.user
  if (!token || !user?.id) throw new Error('Error al iniciar sesión.')

  let premium = false
  try {
    const { data: prData } = await apiFetch('/api/premium', {
      headers: { Authorization: `Bearer ${token}` }
    })
    premium = !!prData?.premium
  } catch (_) {}

  const uid = user.id
  if (premium) activatePremium(uid)
  else deactivatePremium(uid)

  const payload = { user: { id: user.id, email: user.email }, token }
  setStored(payload)
  notify({ uid, email: user.email ?? null })
  return { uid, email: user.email ?? null }
}

/**
 * Login o registro (registro solo crea cuenta, sin activar Premium).
 */
export async function loginOrRegister(email, password) {
  try {
    return await login(email, password)
  } catch (e) {
    if (!e?.message?.includes('incorrectos') && !e?.message?.includes('requeridos')) throw e
    const { ok, data } = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: String(email ?? '').trim().toLowerCase(), password })
    })
    if (!ok) throw new Error(data?.error || 'Error al registrar.')
    return login(email, password)
  }
}

/**
 * Cerrar sesión.
 * Solo se limpia la sesión (token, usuario, premium para este uid).
 * El estado de la app (tareas, racha, etc.) y los recordatorios en localStorage
 * se mantienen para que el usuario pueda seguir usando la app sin cuenta.
 * Si vuelve a iniciar sesión, se cargará el estado del backend y reemplazará el local.
 */
export async function logout() {
  const u = getCurrentUser()
  if (u?.uid) deactivatePremium(u.uid)
  setStored(null)
  notify(null)
}

/**
 * Establecer sesión sin login (p. ej. tras Crear cuenta Premium).
 * user: { id, email }, token: string. Se marca premium.
 */
export function setSession({ user, token }) {
  if (!user?.id || !token) return
  activatePremium(user.id)
  const payload = { user: { id: user.id, email: user.email ?? null }, token }
  setStored(payload)
  notify({ uid: user.id, email: user.email ?? null })
}

/**
 * Suscribirse a cambios de auth. Devuelve función para cancelar.
 */
export function onAuthChange(callback) {
  listeners.add(callback)
  callback(getCurrentUser())
  return () => listeners.delete(callback)
}
