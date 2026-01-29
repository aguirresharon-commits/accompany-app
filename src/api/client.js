/**
 * Cliente API backend (sin Firebase).
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
