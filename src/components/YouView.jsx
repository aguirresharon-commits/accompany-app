// Pantalla de progreso del usuario (acceso desde Configuración → YOU → Ver tu avance)
import { useMemo } from 'react'
import { useAppState } from '../hooks/useAppState'
import BackButton from './BackButton'
import TaskIcon from './TaskIcon'
import './YouView.css'

const MOTIVATIONAL_PHRASES = [
  'Cada acción cuenta. Seguí así.',
  'Tu constancia se nota. Bien hecho.',
  'Un día a la vez. Vas bien.',
  'Cada día que te presentás es un avance.',
  'La racha no define todo: vos sí seguís.',
  'Pequeños pasos, grandes cambios.',
  'Estar presente ya es un logro.',
  'Tu ritmo es válido. Seguí.',
]

const getMotivationalPhrase = (streakCurrent, completedCount, daysPresentThisMonth) => {
  if (streakCurrent >= 7 || completedCount >= 10 || daysPresentThisMonth >= 15) {
    return MOTIVATIONAL_PHRASES[1] // "Tu constancia se nota. Bien hecho."
  }
  if (streakCurrent >= 1 || completedCount >= 1 || daysPresentThisMonth >= 1) {
    return MOTIVATIONAL_PHRASES[0] // "Cada acción cuenta. Seguí así."
  }
  const i = Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)
  return MOTIVATIONAL_PHRASES[i]
}

const YouView = ({ onBack }) => {
  const { streak, completedActions } = useAppState()
  const streakCurrent = streak?.current ?? 0
  const completedCount = Array.isArray(completedActions) ? completedActions.length : 0
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const daysPresentThisMonth = useMemo(() => {
    const days = new Set()
    if (!Array.isArray(completedActions)) return 0
    completedActions.forEach((action) => {
      if (action.date) {
        const [actionYear, actionMonth, actionDay] = action.date.split('-').map(Number)
        if (actionYear === currentYear && actionMonth === currentMonth + 1) {
          days.add(actionDay)
        }
      }
    })
    return days.size
  }, [completedActions, currentYear, currentMonth])

  const motivationalPhrase = useMemo(
    () => getMotivationalPhrase(streakCurrent, completedCount, daysPresentThisMonth),
    [streakCurrent, completedCount, daysPresentThisMonth]
  )

  return (
    <div className="you-view">
      <BackButton onClick={onBack} />
      <div className="you-view__content">
        <h1 className="you-view__title">Tu progreso</h1>
        <div className="you-view__stats">
          <div className="you-view__row">
            <span className="you-view__cell">
              <TaskIcon iconName="flame" className="you-view__icon" size={22} />
              <span className="you-view__label">Racha actual</span>
            </span>
            <span className="you-view__value">{streakCurrent} días</span>
          </div>
          <div className="you-view__row">
            <span className="you-view__cell">
              <TaskIcon iconName="check" className="you-view__icon" size={22} />
              <span className="you-view__label">Acciones completadas</span>
            </span>
            <span className="you-view__value">{completedCount}</span>
          </div>
          <div className="you-view__row">
            <span className="you-view__cell">
              <TaskIcon iconName="calendar" className="you-view__icon" size={22} />
              <span className="you-view__label">Días presente este mes</span>
            </span>
            <span className="you-view__value">{daysPresentThisMonth}</span>
          </div>
        </div>
        <p className="you-view__motivation" role="status">
          <span className="you-view__motivation-star" aria-hidden="true">✦</span>
          {motivationalPhrase}
        </p>
      </div>
    </div>
  )
}

export default YouView
