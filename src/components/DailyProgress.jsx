import { useEffect, useId, useRef, useState } from 'react'
import terrain from '../assets/control-constellation.webp'
import ControlSpark from './ControlSpark'
import { CALENDAR_TASK_LIMIT, PRIORITIES, useCalendarTasks } from '../hooks/useCalendarTasks'
import { playCompleteSound } from '../utils/sounds'
import { getTodayDate } from '../utils/storage'
import YouView from './YouView'
import './DailyProgress.css'

const mountainWidth = 1122
const mountainTop = 380
const mountainHeight = 690
const route = 'M112 963 C133 957 150 949 166 943 C244 936 296 887 360 868 C455 846 485 801 571 772 C660 746 684 690 750 662 C813 633 828 580 895 566'
const stars = [[166, 943], [360, 868], [571, 772], [750, 662], [895, 566]]
const starShape = 'M0 -20Q3 -4 20 0Q3 4 0 20Q-3 4 -20 0Q-3 -4 0 -20Z'

function Constellation({ date, completed, count }) {
  const mask = useId()
  const pathRef = useRef(null)
  const trail = useRef(null)
  const marker = useRef(null)
  const previous = useRef(null)
  const [waypoints, setWaypoints] = useState([])
  const [summit, setSummit] = useState(false)

  useEffect(() => {
    const path = pathRef.current
    const length = path.getTotalLength()
    const destination = count ? completed / count : 0
    const from = previous.current?.date === date ? previous.current.position : destination
    setWaypoints(count === stars.length ? stars : Array.from({ length: count }, (_, index) => {
      const point = path.getPointAtLength(length * (index + 1) / count)
      return [point.x, point.y]
    }))

    function move(position) {
      const point = path.getPointAtLength(position * length)
      trail.current.setAttribute('stroke-dasharray', `${position * 100} 100`)
      marker.current.style.left = `${point.x / mountainWidth * 100}%`
      marker.current.style.top = `${(point.y - mountainTop) / mountainHeight * 100}%`
      marker.current.style.visibility = 'visible'
      previous.current = { date, position }
    }

    if (from === destination || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      move(destination)
      setSummit(destination === 1)
      return
    }

    setSummit(false)
    let frame
    const started = performance.now()
    function animate(now) {
      const fraction = Math.min((now - started) / 600, 1)
      move(from + (destination - from) * (1 - (1 - fraction) ** 3))
      if (fraction < 1) frame = requestAnimationFrame(animate)
      else setSummit(destination === 1)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [date, completed, count])

  return (
    <div className="daily-progress__mountain-scene" aria-hidden="true">
      <svg className="daily-progress__mountain" viewBox={`0 ${mountainTop} ${mountainWidth} ${mountainHeight}`}>
        <defs>
          <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="380" width="1122" height="690">
            <rect x="0" y="380" width="1122" height="690" fill="white" />
            <path d={route} fill="none" stroke="black" strokeWidth="24" />
            {stars.map(([x, y]) => <circle key={x} cx={x} cy={y} r="39" fill="black" />)}
            <ellipse cx="438" cy="814" rx="46" ry="60" fill="black" />
          </mask>
        </defs>
        <image href={terrain} width="1122" height="1402" mask={`url(#${mask})`} />
        <path ref={pathRef} d={route} fill="none" stroke="#585858" strokeWidth="2.5" />
        <path ref={trail} d={route} pathLength="100" fill="none" stroke="#fff8e8" strokeWidth="3" strokeDasharray="0 100" />
        {waypoints.map(([x, y], index) => (
          <path key={x} d={starShape} transform={`translate(${x} ${y})`}
            fill={index < completed ? '#fff9ee' : '#767676'} />
        ))}
        {summit && <circle cx="895" cy="566" r="35" fill="none" stroke="#fff4d3" strokeOpacity=".4" />}
      </svg>
      <div className="daily-progress__marker" ref={marker}>
        <ControlSpark state={summit ? 'done' : 'idle'} />
      </div>
    </div>
  )
}

export default function DailyProgress({ userId, onOpenCalendar, onOpenAlarms, soundsEnabled, soundsVolume }) {
  const { tasks, error, toggleTask } = useCalendarTasks(userId)
  const [selected, setSelected] = useState(null)
  const [writeError, setWriteError] = useState(false)
  const today = getTodayDate()
  const date = selected ?? today
  const current = new Date(`${date}T00:00:00`)
  const entries = tasks.filter(task => task.date === date).sort((a, b) => a.time.localeCompare(b.time))
  const completed = entries.filter(task => task.completed).length

  function moveDay(amount) {
    const next = new Date(current)
    next.setDate(next.getDate() + amount)
    const localDate = next.toLocaleDateString('sv-SE')
    setSelected(localDate >= today ? null : localDate)
    setWriteError(false)
  }

  function toggle(task) {
    try {
      toggleTask(task.id)
      setWriteError(false)
      if (!task.completed && completed === entries.length - 1) playCompleteSound(soundsEnabled, soundsVolume)
    } catch {
      setWriteError(true)
    }
  }

  return (
    <section className="daily-progress" aria-label="Progreso diario">
      <h2>{completed > 0 && completed === entries.length ? 'Llegaste a la cima' : 'Progreso'}</h2>
      <p className="daily-progress__motto">Constelación</p>
      <div className="daily-progress__dates">
        <button type="button" aria-label="Día anterior" onClick={() => moveDay(-1)}>‹</button>
        <span>{date === today ? 'Hoy' : current.toLocaleDateString('es-AR', { dateStyle: 'full' })}</span>
        <button type="button" aria-label="Día siguiente" disabled={date === today} onClick={() => moveDay(1)}>›</button>
      </div>
      <Constellation date={date} completed={completed} count={entries.length} />
      <div className="daily-progress__status" aria-live="polite">
        <p>{completed} de {entries.length} tareas completadas</p>
        <p className="daily-progress__motto">Cada paso cuenta.</p>
      </div>
      <YouView embedded />
      {(error || writeError) && <p role="alert">No se pudo {error ? 'leer' : 'actualizar'} el progreso.</p>}
      {entries.length ? (
        <ul className="daily-progress__tasks" aria-label="Tareas del calendario">
          {entries.map(task => (
            <li key={task.id}>
              <label>
                <input type="checkbox" checked={task.completed} onChange={() => toggle(task)} />
                <span>{task.name}<small className={`calendar-priority--${task.priority}`}>Prioridad {PRIORITIES[task.priority]}</small></span>
                <time dateTime={task.time}>{task.time}</time>
              </label>
            </li>
          ))}
        </ul>
      ) : <p className="daily-progress__empty">Este día todavía no tiene tareas agendadas.</p>}
      <div className="daily-progress__actions">
        <button type="button" onClick={onOpenCalendar}>Ir al calendario</button>
        <button type="button" onClick={onOpenAlarms}>Gestionar alarmas</button>
      </div>
      <p className="daily-progress__limit">Hasta {CALENDAR_TASK_LIMIT} tareas por día</p>
    </section>
  )
}
