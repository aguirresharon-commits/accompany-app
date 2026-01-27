// Vista "Hoy": lista de tareas completadas hoy (nombre, hora, estado, notas)
import { useMemo } from 'react'
import { useAppState } from '../hooks/useAppState'
import { getTodayDate, formatTime } from '../utils/storage'
import { getTaskIcon } from '../data/iconMap'
import TaskIcon from './TaskIcon'
import './TodayView.css'

const TodayView = () => {
  const { completedActions } = useAppState()

  const todayList = useMemo(() => {
    const today = getTodayDate()
    return [...completedActions]
      .filter((c) => c.date === today)
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
  }, [completedActions])

  if (todayList.length === 0) {
    return (
      <div className="today-view">
        <h2 className="today-view__title">Completadas hoy</h2>
        <p className="today-view__empty">Aún no completaste ninguna tarea hoy.</p>
      </div>
    )
  }

  return (
    <div className="today-view">
      <h2 className="today-view__title">Completadas hoy</h2>
      <ul className="today-view__list">
        {todayList.map((c) => (
          <li key={`${c.actionId}-${c.completedAt}`} className="today-view__item">
            <span className="today-view__check" aria-hidden="true">✓</span>
            {c.actionId && getTaskIcon(c.actionId) && (
              <TaskIcon iconName={getTaskIcon(c.actionId)} className="today-view__icon" size={20} />
            )}
            <div className="today-view__content">
              <span className="today-view__text">{c.actionText}</span>
              <span className="today-view__time">{formatTime(c.completedAt)}</span>
              {c.note && <p className="today-view__note">{c.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TodayView
