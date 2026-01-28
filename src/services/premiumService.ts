/**
 * Servicio de estado Premium por usuario.
 * Persiste en localStorage asociado al uid del usuario logueado.
 */

const PREMIUM_STORAGE_KEY = 'control-app-premium'

type PremiumByUid = Record<string, boolean>

function getStorage(): PremiumByUid {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = window.localStorage.getItem(PREMIUM_STORAGE_KEY)
    if (raw == null) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as PremiumByUid
    }
    return {}
  } catch {
    return {}
  }
}

function setStorage(data: PremiumByUid): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('premiumService: no se pudo persistir', e)
  }
}

/**
 * Indica si el usuario con ese uid tiene Premium activo.
 */
export function isPremium(uid: string): boolean {
  if (!uid) return false
  const data = getStorage()
  return Boolean(data[uid])
}

/**
 * Activa Premium para el usuario con ese uid.
 */
export function activatePremium(uid: string): void {
  if (!uid) return
  const data = getStorage()
  data[uid] = true
  setStorage(data)
}

/**
 * Desactiva Premium para el usuario con ese uid.
 */
export function deactivatePremium(uid: string): void {
  if (!uid) return
  const data = getStorage()
  data[uid] = false
  setStorage(data)
}
