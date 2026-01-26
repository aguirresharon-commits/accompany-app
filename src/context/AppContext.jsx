// Context API para estado global de la app
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { saveState, loadState, getTodayDate } from '../utils/storage'
import { ENERGY_LEVEL_KEYS } from '../data/actions'

const migrateEnergyLevel = (level) => {
  if (!level) return null
  if (ENERGY_LEVEL_KEYS.includes(level)) return level
  const map = { veryLow: 'baja', low: 'baja', medium: 'media', good: 'alta' }
  return map[level] || null
}

// Estado inicial
const getInitialState = () => ({
  currentEnergyLevel: null,
  completedActions: [],
  allActions: [], // Historial de todas las acciones mostradas (completadas o no)
  currentAction: null,
  streak: {
    current: 0,
    lastDate: null,
    paused: false
  },
  history: {},
  lastResetDate: getTodayDate(),
  sessionNotes: [], // Notas de sesión (timer) sin completar tarea
  sounds: {
    enabled: true,
    volume: 0.3 // Volumen bajo por defecto (0-1)
  }
})

// Crear contexto
const AppContext = createContext(undefined)

// Provider del contexto
export const AppProvider = ({ children }) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [state, setState] = useState(() => {
    // Intentar cargar estado guardado al inicializar
    const savedState = loadState()
    const today = getTodayDate()
    
    if (savedState) {
      // Migrar acciones completadas a allActions si allActions está vacío
      let allActions = savedState.allActions || []
      if (allActions.length === 0 && savedState.completedActions && savedState.completedActions.length > 0) {
        // Migrar acciones completadas existentes al historial
        allActions = savedState.completedActions.map(completed => ({
          actionId: completed.actionId,
          actionText: completed.actionText,
          emoji: completed.emoji || null,
          level: completed.level,
          date: completed.date,
          shownAt: completed.completedAt || new Date().toISOString(),
          completed: true,
          completedAt: completed.completedAt,
          parentId: completed.parentId || null
        }))
      }
      
      // Reinicio diario: resetear acciones del día anterior
      // Filtrar acciones completadas solo del día de hoy
      const completedActionsToday = (savedState.completedActions || []).filter(
        action => action.date === today
      )
      
      // Resetear acciones de días anteriores en allActions (marcar como no completadas)
      const resetAllActions = (allActions || []).map(action => {
        if (action.date !== today) {
          return {
            ...action,
            completed: false,
            completedAt: undefined
          }
        }
        return action
      })
      
      // Limpiar historial de días anteriores (opcional, mantener solo para referencia)
      const cleanedHistory = savedState.history || {}
      
      const energyLevel = migrateEnergyLevel(savedState.currentEnergyLevel)

      return {
        ...getInitialState(),
        ...savedState,
        currentEnergyLevel: energyLevel,
        completedActions: completedActionsToday,
        allActions: resetAllActions,
        history: cleanedHistory,
        streak: savedState.streak || getInitialState().streak,
        lastResetDate: today,
        sessionNotes: savedState.sessionNotes || [],
        sounds: savedState.sounds || { enabled: true, volume: 0.3 }
      }
    }
    return getInitialState()
  })

  // Simular carga inicial y luego ocultar loader
  useEffect(() => {
    // Pequeño delay para mostrar el loader
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Verificar y resetear acciones diarias
  useEffect(() => {
    const today = getTodayDate()
    const lastResetDate = state.lastResetDate || today
    
    // Si cambió el día, resetear acciones del día anterior
    if (lastResetDate !== today) {
      setState(prev => {
        // Filtrar acciones completadas solo del día de hoy
        const completedActionsToday = prev.completedActions.filter(
          action => action.date === today
        )
        
        // Resetear acciones de días anteriores en allActions (marcar como no completadas)
        const resetAllActions = prev.allActions.map(action => {
          if (action.date !== today) {
            return {
              ...action,
              completed: false,
              completedAt: undefined
            }
          }
          return action
        })
        
        return {
          ...prev,
          completedActions: completedActionsToday,
          allActions: resetAllActions,
          lastResetDate: today
        }
      })
    }
  }, [state.lastResetDate])
  
  // Guardar estado automáticamente cuando cambia
  useEffect(() => {
    saveState(state)
  }, [state])

  // Función para actualizar nivel de energía
  const setEnergyLevel = useCallback((level) => {
    setState(prev => ({
      ...prev,
      currentEnergyLevel: level
    }))
  }, [])

  // Función para completar una acción (note opcional)
  const completeAction = useCallback((action, note = null) => {
    const today = getTodayDate()
    
    setState(prev => {
      // Verificar si la acción ya está completada para evitar duplicados
      const alreadyCompleted = prev.completedActions.some(
        ca => ca.actionId === action.id && ca.date === today
      )
      
      if (alreadyCompleted) {
        return prev
      }

      const completedAt = new Date().toISOString()
      const completedAction = {
        actionId: action.id,
        actionText: action.text,
        emoji: action.emoji || null,
        completedAt,
        level: action.level,
        date: today,
        note: note && String(note).trim() ? String(note).trim() : null
      }

      const newCompletedActions = [...prev.completedActions, completedAction]
      
      const newAllActions = prev.allActions.map(a => {
        if (a.actionId === action.id && a.date === today && !a.completed) {
          return { ...a, completed: true, completedAt, note: completedAction.note }
        }
        if (a.parentId === action.id && a.date === today && !a.completed) {
          return { ...a, completed: true, completedAt, note: completedAction.note }
        }
        if (a.originalId === action.id && a.date === today && !a.completed && action.isReduced) {
          return { ...a, completed: true, completedAt, note: completedAction.note }
        }
        return a
      })
      
      const existsInAllActions = newAllActions.some(
        a => a.actionId === action.id && a.date === today
      )
      if (!existsInAllActions) {
        newAllActions.push({
          actionId: action.id,
          actionText: action.text,
          emoji: action.emoji || null,
          level: action.level,
          date: today,
          shownAt: completedAt,
          completed: true,
          completedAt,
          note: completedAction.note,
          parentId: action.parentId || null,
          originalId: action.originalId || (action.isReduced ? null : action.id)
        })
      }
      
      // Actualizar historial por fecha (evitar duplicados)
      const newHistory = { ...prev.history }
      if (!newHistory[today]) {
        newHistory[today] = []
      }
      // Solo agregar si no está ya en el historial de hoy
      if (!newHistory[today].includes(action.id)) {
        newHistory[today].push(action.id)
      }

      // Actualizar racha
      const newStreak = updateStreakLogic(prev.streak, today)

      return {
        ...prev,
        completedActions: newCompletedActions,
        allActions: newAllActions,
        history: newHistory,
        streak: newStreak,
        currentAction: null // Limpiar acción actual después de completarla
      }
    })
  }, [])

  // Función para establecer acción actual y agregarla al historial
  const setCurrentAction = useCallback((action) => {
    if (!action) return
    
    const today = getTodayDate()
    const actionEntry = {
      actionId: action.id,
      actionText: action.text,
      emoji: action.emoji || null,
      level: action.level,
      date: today,
      shownAt: new Date().toISOString(),
      completed: false,
      parentId: action.parentId || (action.isReduced ? action.originalId || null : null),
      originalId: action.originalId || (action.isReduced ? null : action.id)
    }

    setState(prev => {
      // Verificar si la acción ya está en el historial del mismo día (evitar duplicados)
      // Una tarea por actionId por día, sin importar si está completada o no
      // También considerar parentId para acciones reducidas
      const existingIndex = prev.allActions.findIndex(
        a => a.actionId === action.id && 
             a.date === today &&
             (action.parentId ? a.parentId === action.parentId : !a.parentId) // Si tiene parentId, debe coincidir
      )
      
      let newAllActions
      if (existingIndex >= 0) {
        // Si ya existe, actualizar la fecha de mostrado pero mantener el estado de completado
        newAllActions = [...prev.allActions]
        newAllActions[existingIndex] = {
          ...newAllActions[existingIndex],
          shownAt: new Date().toISOString(),
          // No sobrescribir completed si ya estaba completada
          completed: newAllActions[existingIndex].completed || false,
          // Actualizar parentId y originalId si es necesario
          parentId: actionEntry.parentId || newAllActions[existingIndex].parentId,
          originalId: actionEntry.originalId || newAllActions[existingIndex].originalId
        }
      } else {
        // Si no existe, agregarla
        newAllActions = [...prev.allActions, actionEntry]
      }

      return {
        ...prev,
        currentAction: action,
        allActions: newAllActions
      }
    })
  }, [])

  // Función para actualizar racha manualmente (pausar/reanudar)
  const updateStreak = useCallback((streakData) => {
    setState(prev => ({
      ...prev,
      streak: { ...prev.streak, ...streakData }
    }))
  }, [])

  // Función para limpiar estado (reset)
  const resetState = useCallback(() => {
    setState(getInitialState())
  }, [])

  // Función para obtener acciones completadas hoy
  const getTodayActions = useCallback(() => {
    const today = getTodayDate()
    return state.completedActions.filter(action => action.date === today)
  }, [state.completedActions])

  // Función para resetear acciones completadas de hoy
  const resetTodayActions = useCallback(() => {
    const today = getTodayDate()
    setState(prev => {
      // Filtrar acciones que NO son de hoy
      const filteredActions = prev.completedActions.filter(action => action.date !== today)
      
      // Limpiar historial de hoy
      const newHistory = { ...prev.history }
      delete newHistory[today]
      
      // Recalcular racha si es necesario
      const newStreak = { ...prev.streak }
      // Si no hay acciones después del filtro, ajustar racha
      if (filteredActions.length === 0 && prev.streak.lastDate === today) {
        // Buscar la última fecha con acciones
        const lastDateWithActions = Object.keys(newHistory).sort().pop()
        newStreak.lastDate = lastDateWithActions || null
        if (!lastDateWithActions) {
          newStreak.current = 0
        }
      }
      
      return {
        ...prev,
        completedActions: filteredActions,
        history: newHistory,
        streak: newStreak
      }
    })
  }, [])

  // Función para resetear todas las acciones completadas
  const resetAllActions = useCallback(() => {
    setState(prev => ({
      ...prev,
      completedActions: [],
      allActions: prev.allActions.map(action => ({
        ...action,
        completed: false,
        completedAt: undefined
      })),
      history: {},
      streak: {
        current: 0,
        lastDate: null,
        paused: prev.streak.paused // Mantener el estado de pausa
      }
    }))
  }, [])

  // Nota de sesión (timer) sin completar tarea
  const addSessionNote = useCallback((action, note) => {
    if (!action || !(note && String(note).trim())) return
    const today = getTodayDate()
    const entry = {
      actionId: action.id,
      actionText: action.text,
      emoji: action.emoji || null,
      date: today,
      note: String(note).trim(),
      createdAt: new Date().toISOString()
    }
    setState(prev => ({
      ...prev,
      sessionNotes: [...(prev.sessionNotes || []), entry]
    }))
  }, [])

  // Actualizar configuración de sonidos
  const setSoundsEnabled = useCallback((enabled) => {
    setState(prev => ({
      ...prev,
      sounds: {
        ...(prev.sounds || { enabled: true, volume: 0.3 }),
        enabled
      }
    }))
  }, [])

  const setSoundsVolume = useCallback((volume) => {
    setState(prev => ({
      ...prev,
      sounds: {
        ...(prev.sounds || { enabled: true, volume: 0.3 }),
        volume: Math.max(0, Math.min(1, volume)) // Clamp entre 0 y 1
      }
    }))
  }, [])

  // Valor del contexto
  const value = {
    ...state,
    setEnergyLevel,
    completeAction,
    setCurrentAction,
    updateStreak,
    resetState,
    getTodayActions,
    resetTodayActions,
    resetAllActions,
    addSessionNote,
    setSoundsEnabled,
    setSoundsVolume,
    isInitialLoading
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Lógica para actualizar racha (rachas humanas que no se rompen)
const updateStreakLogic = (currentStreak, today) => {
  const { current, lastDate, paused } = currentStreak

  // Si está pausada, no actualizar
  if (paused) {
    return currentStreak
  }

  // Si no hay última fecha, empezar racha
  if (!lastDate) {
    return {
      current: 1,
      lastDate: today,
      paused: false
    }
  }

  // Si la última acción fue hoy, mantener racha
  if (lastDate === today) {
    return currentStreak
  }

  // Calcular diferencia de días
  const lastDateObj = new Date(lastDate)
  const todayObj = new Date(today)
  const diffTime = todayObj - lastDateObj
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Si la última acción fue ayer, incrementar racha
  if (diffDays === 1) {
    return {
      current: current + 1,
      lastDate: today,
      paused: false
    }
  }

  // Si pasó más de un día pero menos de 7, mantener racha (no se rompe)
  // Esto es parte del enfoque "humano" - no castigar por gaps pequeños
  if (diffDays > 1 && diffDays < 7) {
    return {
      current: current, // Mantener racha actual
      lastDate: today,
      paused: false
    }
  }

  // Si pasó mucho tiempo (más de 7 días), reiniciar racha suavemente
  if (diffDays >= 7) {
    return {
      current: 1, // Empezar de nuevo sin culpa
      lastDate: today,
      paused: false
    }
  }

  return currentStreak
}

// Hook para usar el contexto fácilmente
export const useAppState = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppState debe usarse dentro de AppProvider')
  }
  return context
}
