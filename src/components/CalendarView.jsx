// Vista Calendario: calendario mensual, días marcados con tareas, detalle al tocar
import { useState, useMemo } from 'react'
import { useAppState } from '../hooks/useAppState'
import { formatTime } from '../utils/storage'
import DayDetailModal from './DayDetailModal'
import './CalendarView.css'

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const CalendarView = ({ isPremium: isPremiumProp, onRequestPremium }) => {
  const { completedActions } = useAppState()
  const isPremium = isPremiumProp === true
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Obtener días del mes con tareas completadas
  const daysWithTasks = useMemo(() => {
    const days = new Set()
    completedActions.forEach((action) => {
      if (action.date) {
        // Parsear fecha directamente desde string YYYY-MM-DD para evitar problemas de zona horaria
        const [actionYear, actionMonth, actionDay] = action.date.split('-').map(Number)
        if (actionYear === year && actionMonth === month + 1) {
          days.add(actionDay)
        }
      }
    })
    return days
  }, [completedActions, year, month])

  // Contar días presentes este mes
  const daysPresent = daysWithTasks.size

  // Obtener primer día del mes y cantidad de días
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Generar array de días del mes
  const days = []
  // Días vacíos al inicio
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()
  const isPastDay = (day) => {
    if (year < todayYear) return true
    if (year === todayYear && month < todayMonth) return true
    if (year === todayYear && month === todayMonth && day < todayDay) return true
    return false
  }
  const isToday = (day) =>
    year === todayYear && month === todayMonth && day === todayDay

  const handleDayClick = (day) => {
    if (!day) return
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (!isPremium && (isPastDay(day) || !isToday(day))) {
      onRequestPremium?.()
      return
    }
    setSelectedDate(dateStr)
  }

  const handlePrevMonth = () => {
    if (!isPremium) {
      onRequestPremium?.()
      return
    }
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleCloseModal = () => {
    setSelectedDate(null)
  }

  return (
    <div className="calendar-view">
      <div className="calendar-view__header">
        <h2 className="calendar-view__title">{MONTHS[month]} {year}</h2>
        <p className="calendar-view__presence">
          Estuviste presente {daysPresent} {daysPresent === 1 ? 'día' : 'días'} este mes.
        </p>
      </div>

      <div className="calendar-view__controls">
        <button
          type="button"
          className="calendar-view__nav"
          onClick={handlePrevMonth}
          aria-label="Mes anterior"
        >
          ←
        </button>
        <button
          type="button"
          className="calendar-view__nav"
          onClick={handleNextMonth}
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="calendar-view__calendar">
        <div className="calendar-view__weekdays">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="calendar-view__weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-view__days">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="calendar-view__day calendar-view__day--empty" />
            }
            const hasTasks = daysWithTasks.has(day)
            const isPast = isPastDay(day)
            const isCurrentDay = isToday(day)
            return (
              <button
                key={day}
                type="button"
                className={`calendar-view__day ${hasTasks ? 'calendar-view__day--completed' : ''} ${isPast ? 'calendar-view__day--past' : ''} ${isCurrentDay ? 'calendar-view__day--today' : ''}`}
                onClick={() => handleDayClick(day)}
                aria-label={`Día ${day}${hasTasks ? ' con tareas completadas' : ''}${isPast ? ' pasado' : ''}`}
              >
                <span className="calendar-view__day-number">{day}</span>
                {hasTasks && <span className="calendar-view__day-mark" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default CalendarView
