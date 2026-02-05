/**
 * Cliente API backend.
 * Auth: cookie (credentials: 'include') y/o JWT en Authorization si está guardado (p. ej. tras Google OAuth).
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const AUTH_STORAGE_KEY = 'control-app-auth'

function getStoredToken() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage?.getItem(AUTH_STORAGE_KEY) : null
    if (!raw) return null
    const p = JSON.parse(raw)
    return p?.token ?? null
  } catch {
    return null
  }
}

export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getStoredToken()
  if (token && headers.Authorization === undefined) {
    headers.Authorization = `Bearer ${token}`
  }
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-expired'))
    }
    return { ok: false, status: 401, data: {} }
  }
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
