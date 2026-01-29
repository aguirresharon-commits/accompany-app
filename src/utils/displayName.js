// Nombre opcional asociado al uid (Premium). Persistencia local.
const STORAGE_KEY = 'control-app-display-names'

function readAll() {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(data) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/**
 * Devuelve el nombre guardado para el uid, o null si no hay.
 */
export function getDisplayName(uid) {
  if (!uid) return null
  const data = readAll()
  const name = data[uid]
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

/**
 * Guarda el nombre para el uid. Si name es vacío, se borra.
 */
export function setDisplayName(uid, name) {
  if (!uid) return
  const data = readAll()
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed) {
    data[uid] = trimmed
  } else {
    delete data[uid]
  }
  writeAll(data)
}
