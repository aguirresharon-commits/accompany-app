import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../hooks/useAppState'
import { CALENDAR_TASK_LIMIT, PRIORITIES, useCalendarTasks } from '../hooks/useCalendarTasks'
import { formatTime, getTodayDate } from '../utils/storage'
import './CalendarView.css'

const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const monthLabel = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const dayLabel = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' })

function entryClass(task) {
  return task.completed ? 'calendar-entry--done' : `calendar-priority--${task.priority}`
}

function CalendarDay({ date, tasks, onClose, onAdd, onToggle }) {
  const dialog = useRef(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const atLimit = tasks.filter(task => !task.fromHistory).length >= CALENDAR_TASK_LIMIT

  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])

  function save(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = fields.get('name').trim()
    const time = fields.get('time')
    const priority = fields.get('priority')
    if (!name || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError('Ingresá un nombre y una hora.')
      return
    }
    try {
      if (!onAdd({ name, time, priority })) {
        setError(`Podés agendar hasta ${CALENDAR_TASK_LIMIT} tareas por día.`)
        return
      }
      setEditing(false)
      setError('')
    } catch {
      setError('No se pudo guardar la tarea en este navegador.')
    }
  }

  return (
    <dialog ref={dialog} className="day-detail" aria-labelledby="calendar-day-title"
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="day-detail__content">
        <header className="day-detail__header">
          <h3 id="calendar-day-title">{dayLabel.format(new Date(`${date}T00:00:00`))}</h3>
          <button type="button" className="day-detail__button" onClick={onClose}>Cerrar</button>
        </header>
        {tasks.length === 0 && <p>Todavía no hay tareas para este día.</p>}
        {tasks.length > 0 && (
          <ul className="day-detail__list">
            {tasks.map(task => (
              <li key={task.id} className={`day-detail__task ${entryClass(task)}`}>
                {!task.fromHistory && (
                  <input type="checkbox" checked={task.completed} aria-label={task.name}
                    onChange={() => {
                      try { onToggle(task.id); setError('') }
                      catch { setError('No se pudo actualizar la tarea.') }
                    }} />
                )}
                <div>
                  <strong>{task.name}</strong>
                  <span>{[task.time, task.priority && `Prioridad ${PRIORITIES[task.priority]}`, task.completed && 'Completada'].filter(Boolean).join(' · ')}</span>
                  {task.note && <p>{task.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {editing ? (
          <form className="day-detail__fields" onSubmit={save}>
            <label htmlFor="calendar-task-name">Nombre</label>
            <input id="calendar-task-name" name="name" maxLength={100} required autoFocus />
            <div className="day-detail__row">
              <label>Hora<input name="time" type="time" defaultValue="09:00" required /></label>
              <label>Prioridad
                <select name="priority" defaultValue="media">
                  {Object.entries(PRIORITIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <div className="day-detail__actions">
              <button type="button" className="day-detail__button" onClick={() => { setEditing(false); setError('') }}>Cancelar</button>
              <button className="day-detail__button day-detail__button--primary">Guardar tarea</button>
            </div>
          </form>
        ) : atLimit ? (
          <p>Ya agendaste {CALENDAR_TASK_LIMIT} tareas para este día.</p>
        ) : (
          <button type="button" className="day-detail__button day-detail__button--primary" onClick={() => setEditing(true)}>Agregar tarea</button>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
    </dialog>
  )
}

export default function CalendarView({ userId }) {
  const { completedActions } = useAppState()
  const { tasks, error, addTask, toggleTask } = useCalendarTasks(userId)
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [clock, setClock] = useState(() => new Date())
  const today = getTodayDate()
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const offset = new Date(year, monthIndex, 1).getDay()
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 15000)
    return () => clearInterval(timer)
  }, [])

  const entries = new Map()
  for (const task of [...tasks].sort((a, b) => a.time.localeCompare(b.time))) {
    if (!entries.has(task.date)) entries.set(task.date, [])
    entries.get(task.date).push(task)
  }
  for (const action of completedActions) {
    if (!action.date) continue
    if (!entries.has(action.date)) entries.set(action.date, [])
    entries.get(action.date).push({
      id: `history-${action.actionId}-${action.completedAt}`,
      name: action.actionText, time: formatTime(action.completedAt), note: action.note,
      completed: true, fromHistory: true,
    })
  }
  const todaysEntries = entries.get(today) ?? []
  const pending = todaysEntries.filter(task => !task.completed)
  const next = pending.find(task => task.time >= clock.toTimeString().slice(0, 5))

  function openToday() {
    setMonth(new Date(`${today}T00:00:00`))
    setSelectedDate(today)
  }

  return (
    <section className="calendar-view" aria-label="Calendario de tareas">
      <header className="calendar-view__header">
        <h2>{monthLabel.format(month)}</h2>
        <div className="calendar-view__controls">
          <button type="button" aria-label="Mes anterior" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}>‹</button>
          <button type="button" onClick={openToday}>Hoy</button>
          <button type="button" aria-label="Mes siguiente" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}>›</button>
        </div>
      </header>
      <button type="button" className={`calendar-view__next ${next ? entryClass(next) : ''}`} onClick={openToday}>
        <span>Hoy · {next ? `${next.time} · Prioridad ${PRIORITIES[next.priority]}` : 'Agenda del día'}</span>
        <strong>{next?.name || (pending.length ? 'Tenés tareas pendientes' : todaysEntries.length ? 'Todo listo por hoy' : 'Sin tareas programadas')}</strong>
      </button>
      {error && <p role="status">No se pudo leer la agenda guardada en este navegador.</p>}
      <div className="calendar-view__grid">
        {weekdays.map(day => <span key={day} className="calendar-view__weekday">{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
        {Array.from({ length: days }, (_, index) => {
          const date = prefix + String(index + 1).padStart(2, '0')
          const items = entries.get(date) ?? []
          const openTasks = items.filter(task => !task.completed)
          const done = items.length > 0 && openTasks.length === 0
          const display = [...openTasks, ...items.filter(task => task.completed)]
          return (
            <button key={date} type="button"
              className={`calendar-view__day ${done ? 'calendar-view__day--completed' : ''} ${date < today && !items.length ? 'calendar-view__day--past-empty' : ''}`}
              aria-current={date === today ? 'date' : undefined} onClick={() => setSelectedDate(date)}>
              <span className="calendar-view__date">
                <span className="calendar-view__sr">{dayLabel.format(new Date(`${date}T00:00:00`))}</span>
                <span aria-hidden="true">{index + 1}</span>
                {done && <span className="calendar-view__check calendar-entry--done" aria-label="Día completado">✓</span>}
              </span>
              {display.slice(0, 2).map(task => (
                <span key={task.id} className={`calendar-view__entry ${entryClass(task)}`} title={task.name}>{task.name}</span>
              ))}
              {display.length > 2 && <span className="calendar-view__extra">+{display.length - 2} más</span>}
            </button>
          )
        })}
      </div>
      <ul className="calendar-view__legend" aria-label="Colores del calendario">
        {Object.entries(PRIORITIES).map(([value, label]) => <li key={value} className={`calendar-priority--${value}`}>{label}</li>)}
        <li className="calendar-entry--done">Día completado</li>
      </ul>
      {selectedDate && <CalendarDay key={`${userId}:${selectedDate}`} date={selectedDate}
        tasks={entries.get(selectedDate) ?? []} onClose={() => setSelectedDate(null)}
        onAdd={task => addTask(selectedDate, task)} onToggle={toggleTask} />}
    </section>
  )
}
