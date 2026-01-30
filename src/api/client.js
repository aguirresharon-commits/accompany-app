/**
 * Cliente API backend (sin Firebase).
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function apiFetch(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    })
  } catch (err) {
    const msg = err?.message || ''
    if (msg.includes('fetch') || msg.includes('Failed') || msg.includes('NetworkError') || msg.includes('Load')) {
      throw new Error('Error de conexión. ¿Está el servidor en marcha? (npm run dev en /server)')
    }
    throw err
  }
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
