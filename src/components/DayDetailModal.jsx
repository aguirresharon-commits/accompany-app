// Modal detalle de día: tareas y notas de un día específico, o mensaje amable si no hay
import { useMemo } from 'react'
import { useAppState } from '../hooks/useAppState'
import { formatTime } from '../utils/storage'
import { getTaskIcon } from '../data/iconMap'
import TaskIcon from './TaskIcon'
import './DayDetailModal.css'

const DayDetailModal = ({ date, onClose }) => {
  const { completedActions } = useAppState()

  const dayTasks = useMemo(() => {
    return [...completedActions]
      .filter((action) => action.date === date)
      .sort((a, b) => (a.completedAt || '').localeCompare(b.completedAt || ''))
  }, [completedActions, date])

  const dateObj = new Date(date + 'T00:00:00')
  const dayName = dateObj.toLocaleDateString('es-AR', { weekday: 'long' })
  const dayNumber = dateObj.getDate()
  const monthName = dateObj.toLocaleDateString('es-AR', { month: 'long' })
  const formattedDate = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="day-detail" role="dialog" aria-label={`Detalle del ${formattedDate}`} aria-modal="true">
      <button
        type="button"
        className="day-detail__backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="day-detail__sheet" onClick={handleBackdropClick}>
        <div className="day-detail__content" onClick={(e) => e.stopPropagation()}>
          <h3 className="day-detail__date">{formattedDate}</h3>
          {dayTasks.length === 0 ? (
            <div className="day-detail__empty">
              <p className="day-detail__empty-text">
                Ese día no completaste ninguna tarea.
              </p>
              <p className="day-detail__empty-hint">
                Está bien. Cada día es una oportunidad.
              </p>
            </div>
          ) : (
            <ul className="day-detail__list">
              {dayTasks.map((task) => (
                <li key={`${task.actionId}-${task.completedAt}`} className="day-detail__item">
                  <span className="day-detail__check" aria-hidden="true">✓</span>
                  {task.actionId && getTaskIcon(task.actionId) && (
                    <TaskIcon iconName={getTaskIcon(task.actionId)} className="day-detail__icon" size={20} />
                  )}
                  <div className="day-detail__content-item">
                    <span className="day-detail__text">{task.actionText}</span>
                    <span className="day-detail__time">{formatTime(task.completedAt)}</span>
                    {task.note && (
                      <p className="day-detail__note">{task.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="day-detail__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DayDetailModal
