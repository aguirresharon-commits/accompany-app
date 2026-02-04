/**
 * Auth vía backend (API + cookie httpOnly). Sin Firebase.
 * No se guardan tokens en localStorage; permisos (userPlan) vienen de /api/auth/me.
 */
import { apiFetch } from '../api/client.js'
import { activatePremium, deactivatePremium } from './premiumService'

const AUTH_KEY = 'control-app-auth'
const listeners = new Set()

function getStored() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage?.getItem(AUTH_KEY) : null
    if (!raw) return null
    const p = JSON.parse(raw)
    return p?.user ? p : null
  } catch {
    return null
  }
}

function setStored(payload) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    if (payload) {
      const toSave = {
        user: payload.user,
        userPlan: payload.userPlan ?? 'free'
      }
      if (payload.token != null) toSave.token = payload.token
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(toSave))
    } else {
      window.localStorage.removeItem(AUTH_KEY)
    }
  } catch (e) {
    console.warn('authService: no se pudo persistir', e)
  }
}

/** Devuelve el token JWT si está guardado (p. ej. tras login con Google). */
export function getStoredToken() {
  const s = getStored()
  return s?.token ?? null
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

  const { ok, data } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: trimEmail, password })
  })

  if (!ok) {
    throw new Error(data?.error || 'Email o contraseña incorrectos.')
  }

  const user = data?.user
  if (!user?.id) throw new Error('Error al iniciar sesión.')

  const userPlan = data?.userPlan === 'premium' ? 'premium' : 'free'
  const token = data?.token ?? null
  const uid = user.id
  if (userPlan === 'premium') activatePremium(uid)
  else deactivatePremium(uid)

  setStored({ user: { id: user.id, email: user.email }, userPlan, token })
  notify({ uid, email: user.email ?? null })
  return { uid, email: user.email ?? null }
}

/**
 * Login o registro. Crear cuenta no activa Premium; el usuario nace como free.
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
    const user = data?.user
    if (!user?.id) throw new Error('Error al registrar.')
    const userPlan = data?.userPlan === 'premium' ? 'premium' : 'free'
    const token = data?.token ?? null
    setStored({ user: { id: user.id, email: user.email }, userPlan, token })
    notify({ uid: user.id, email: user.email ?? null })
    return { uid: user.id, email: user.email ?? null }
  }
}

/**
 * Cerrar sesión.
 * Limpia cookie en backend y sesión local.
 */
export async function logout() {
  const u = getCurrentUser()
  if (u?.uid) deactivatePremium(u.uid)
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch (_) {}
  setStored(null)
  notify(null)
}

/**
 * Establecer sesión (p. ej. tras registro). user: { id, email }, userPlan opcional.
 */
export function setSession({ user, userPlan = 'free' }) {
  if (!user?.id) return
  if (userPlan === 'premium') activatePremium(user.id)
  else deactivatePremium(user.id)
  setStored({ user: { id: user.id, email: user.email ?? null }, userPlan })
  notify({ uid: user.id, email: user.email ?? null })
}

/**
 * Establecer sesión tras OAuth (Google). Obsoleto: usar setSessionFromCookie (cookie httpOnly).
 */
export async function setSessionFromOAuth({ user, userPlan = 'free' }) {
  if (!user?.id) return
  if (userPlan === 'premium') activatePremium(user.id)
  else deactivatePremium(user.id)
  setStored({ user: { id: user.id, email: user.email ?? null }, userPlan })
  notify({ uid: user.id, email: user.email ?? null })
}

/**
 * Establecer sesión desde cookie (Google OAuth con httpOnly).
 * Llama a /api/auth/me (credentials: 'include'); devuelve user y userPlan.
 */
export async function setSessionFromCookie() {
  try {
    const { ok, data } = await apiFetch('/api/auth/me')
    if (!ok || !data?.user) return
    const user = data.user
    const userPlan = data?.userPlan === 'premium' ? 'premium' : 'free'
    if (userPlan === 'premium') activatePremium(user.id)
    else deactivatePremium(user.id)
    setStored({ user: { id: user.id, email: user.email ?? null }, userPlan })
    notify({ uid: user.id, email: user.email ?? null })
  } catch (_) {}
}

/**
 * Establecer sesión tras callback de Google OAuth.
 * El backend redirige con ?from=google#token=JWT&user=... (hash) o ?from=google&token=...&user=... (query como fallback).
 * Algunos navegadores pierden el hash en redirects cross-origin; por eso el backend también envía token/user en query.
 * Parsea hash o query, guarda token y user en localStorage y notifica.
 * Opcionalmente obtiene userPlan con GET /api/auth/me.
 */
export async function setSessionFromGoogleCallback(hashOrQuery) {
  const getParams = () => {
    if (typeof window === 'undefined') return null
    const hash = window.location.hash?.replace(/^#/, '')
    if (hash) return new URLSearchParams(hash)
    return new URLSearchParams(window.location.search)
  }
  const params = typeof hashOrQuery === 'string' && hashOrQuery ? new URLSearchParams(hashOrQuery.replace(/^#/, '')) : getParams()
  if (!params) return false
  const token = params.get('token')
  const userStr = params.get('user')
  if (!token || !userStr) return false
  let user
  try {
    user = JSON.parse(decodeURIComponent(userStr))
  } catch (_) {
    return false
  }
  if (!user?.id) return false
  let userPlan = 'free'
  try {
    const { ok, data } = await apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (ok && data?.userPlan === 'premium') userPlan = 'premium'
  } catch (_) {}
  if (userPlan === 'premium') activatePremium(user.id)
  else deactivatePremium(user.id)
  setStored({ user: { id: user.id, email: user.email ?? null }, userPlan, token })
  notify({ uid: user.id, email: user.email ?? null })
  return true
}

/**
 * Refrescar sesión desde el backend (cookie). Útil al cargar la app.
 * Si hay cookie válida, actualiza user + userPlan y notifica.
 */
export async function refreshSession() {
  try {
    const { ok, data } = await apiFetch('/api/auth/me')
    if (!ok || !data?.user) {
      setStored(null)
      notify(null)
      return
    }
    const user = data.user
    const userPlan = data?.userPlan === 'premium' ? 'premium' : 'free'
    if (userPlan === 'premium') activatePremium(user.id)
    else deactivatePremium(user.id)
    setStored({ user: { id: user.id, email: user.email ?? null }, userPlan })
    notify({ uid: user.id, email: user.email ?? null })
  } catch (_) {
    setStored(null)
    notify(null)
  }
}

/**
 * Suscribirse a cambios de auth. Devuelve función para cancelar.
 */
export function onAuthChange(callback) {
  listeners.add(callback)
  callback(getCurrentUser())
  return () => listeners.delete(callback)
}
