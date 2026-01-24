// Context API para estado global de la app
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { saveState, loadState, getTodayDate } from '../utils/storage'

// Estado inicial
const initialState = {
  currentEnergyLevel: null,
  completedActions: [],
  currentAction: null,
  streak: {
    current: 0,
    lastDate: null,
    paused: false
  },
  history: {}
}

// Crear contexto
const AppContext = createContext(undefined)

// Provider del contexto
export const AppProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    // Intentar cargar estado guardado al inicializar
    const savedState = loadState()
    if (savedState) {
      // Validar y limpiar datos antiguos si es necesario
      return {
        ...initialState,
        ...savedState,
        // Asegurar que la estructura sea correcta
        completedActions: savedState.completedActions || [],
        history: savedState.history || {},
        streak: savedState.streak || initialState.streak
      }
    }
    return initialState
  })

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

  // Función para completar una acción
  const completeAction = useCallback((action) => {
    const today = getTodayDate()
    const completedAction = {
      actionId: action.id,
      actionText: action.text,
      completedAt: new Date().toISOString(),
      level: action.level,
      date: today
    }

    setState(prev => {
      // Agregar a acciones completadas
      const newCompletedActions = [...prev.completedActions, completedAction]
      
      // Actualizar historial por fecha
      const newHistory = { ...prev.history }
      if (!newHistory[today]) {
        newHistory[today] = []
      }
      newHistory[today].push(action.id)

      // Actualizar racha
      const newStreak = updateStreakLogic(prev.streak, today)

      return {
        ...prev,
        completedActions: newCompletedActions,
        history: newHistory,
        streak: newStreak,
        currentAction: null // Limpiar acción actual después de completarla
      }
    })
  }, [])

  // Función para establecer acción actual
  const setCurrentAction = useCallback((action) => {
    setState(prev => ({
      ...prev,
      currentAction: action
    }))
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
    setState(initialState)
  }, [])

  // Función para obtener acciones completadas hoy
  const getTodayActions = useCallback(() => {
    const today = getTodayDate()
    return state.completedActions.filter(action => action.date === today)
  }, [state.completedActions])

  // Valor del contexto
  const value = {
    ...state,
    setEnergyLevel,
    completeAction,
    setCurrentAction,
    updateStreak,
    resetState,
    getTodayActions
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
