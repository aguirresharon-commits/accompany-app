// Utilidades para localStorage
// Manejo seguro de persistencia local

const STORAGE_KEY = 'control-app-state'

// Verificar si localStorage está disponible
const isStorageAvailable = () => {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

// Guardar estado completo en localStorage
export const saveState = (state) => {
  if (!isStorageAvailable()) {
    console.warn('localStorage no está disponible')
    return false
  }

  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serializedState)
    return true
  } catch (error) {
    console.error('Error al guardar estado:', error)
    return false
  }
}

// Cargar estado completo desde localStorage
export const loadState = () => {
  if (!isStorageAvailable()) {
    return null
  }

  try {
    const serializedState = localStorage.getItem(STORAGE_KEY)
    if (serializedState === null) {
      return null
    }
    return JSON.parse(serializedState)
  } catch (error) {
    console.error('Error al cargar estado:', error)
    // Si hay error, limpiar datos corruptos
    clearState()
    return null
  }
}

// Limpiar estado guardado
export const clearState = () => {
  if (!isStorageAvailable()) {
    return false
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Error al limpiar estado:', error)
    return false
  }
}

// Guardar una clave específica
export const saveKey = (key, value) => {
  if (!isStorageAvailable()) {
    return false
  }

  try {
    const currentState = loadState() || {}
    const newState = { ...currentState, [key]: value }
    return saveState(newState)
  } catch (error) {
    console.error('Error al guardar clave:', error)
    return false
  }
}

// Cargar una clave específica
export const loadKey = (key) => {
  const state = loadState()
  if (!state) {
    return null
  }
  return state[key] || null
}

// Obtener fecha actual en formato YYYY-MM-DD (usando fecha local, no UTC)
export const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Verificar si una fecha es hoy
export const isToday = (dateString) => {
  if (!dateString) return false
  return dateString === getTodayDate()
}

// Verificar si una fecha es ayer
export const isYesterday = (dateString) => {
  if (!dateString) return false
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const year = yesterday.getFullYear()
  const month = String(yesterday.getMonth() + 1).padStart(2, '0')
  const day = String(yesterday.getDate()).padStart(2, '0')
  return dateString === `${year}-${month}-${day}`
}

// Formatear hora HH:mm desde ISO
export const formatTime = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
