/**
 * Cliente API backend (sin Firebase).
 * Lee el token de la estructura actual de control-app-auth (sin modificarla) y lo envía en Authorization.
 * En 401, llama al logout existente del authService.
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const AUTH_STORAGE_KEY = 'control-app-auth'

export async function apiFetch(path, options = {}) {
  let token = null
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage?.getItem(AUTH_STORAGE_KEY) : null
    if (raw) {
      const p = JSON.parse(raw)
      if (p?.user && p?.token) token = p.token
    }
  } catch {}

  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token && headers.Authorization === undefined) {
    headers.Authorization = `Bearer ${token}`
  }
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    })
  } catch (err) {
    const msg = err?.message || ''
    if (msg.includes('fetch') || msg.includes('Failed') || msg.includes('NetworkError') || msg.includes('Load')) {
      throw new Error('Error de conexión. ¿Está el servidor en marcha? (npm run dev en /server)')
    }
    throw err
  }
  if (res.status === 401) {
    const { logout } = await import('../services/authService.js')
    await logout()
  }
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
