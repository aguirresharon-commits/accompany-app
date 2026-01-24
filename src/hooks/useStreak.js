// Hook para gestionar rachas de forma empática
import { useMemo } from 'react'
import { useAppState } from './useAppState'
import { getTodayDate, isToday, isYesterday } from '../utils/storage'

export const useStreak = () => {
  const { streak, completedActions, history } = useAppState()
  const today = getTodayDate()

  // Calcular información de racha
  const streakInfo = useMemo(() => {
    const { current, lastDate, paused } = streak

    // Verificar si hay acciones hoy
    const hasActionToday = history[today] && history[today].length > 0

    // Verificar si hay acciones ayer
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const hasActionYesterday = history[yesterdayStr] && history[yesterdayStr].length > 0

    // Calcular días desde última acción
    let daysSinceLastAction = null
    if (lastDate) {
      const lastDateObj = new Date(lastDate)
      const todayObj = new Date(today)
      const diffTime = todayObj - lastDateObj
      daysSinceLastAction = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    return {
      current,
      lastDate,
      paused,
      hasActionToday,
      hasActionYesterday,
      daysSinceLastAction,
      // Mensaje empático sobre la racha
      message: getStreakMessage(current, paused, hasActionToday, daysSinceLastAction)
    }
  }, [streak, history, today])

  return streakInfo
}

// Función para obtener mensaje empático sobre la racha
const getStreakMessage = (current, paused, hasActionToday, daysSinceLastAction) => {
  if (paused) {
    return 'Tu racha está pausada. Cuando quieras, seguimos.'
  }

  if (hasActionToday) {
    if (current === 0) {
      return 'Empezaste hoy. Bien.'
    }
    if (current === 1) {
      return 'Un día. Bien.'
    }
    return `${current} días. Seguís.`
  }

  if (current === 0) {
    return 'Cuando quieras, empezamos.'
  }

  if (daysSinceLastAction === null || daysSinceLastAction === 0) {
    return `${current} días.`
  }

  if (daysSinceLastAction === 1) {
    return `${current} días. Ayer no hiciste nada, pero está bien.`
  }

  if (daysSinceLastAction < 7) {
    return `${current} días. Hace ${daysSinceLastAction} días que no haces nada, pero tu racha sigue.`
  }

  return 'Cuando quieras, volvemos a empezar. Sin culpa.'
}
