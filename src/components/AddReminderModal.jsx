// Modal: crear o editar recordatorio (texto, día, hora, alarma)
import { useEffect, useMemo, useRef, useState } from 'react'
import { getTodayDate } from '../utils/storage'
import BackButton from './BackButton'
import './AddReminderModal.css'

const AddReminderModal = ({ onClose, onCreate, initial }) => {
  const today = useMemo(() => getTodayDate(), [])
  const [text, setText] = useState(initial?.text ?? '')
  const [date, setDate] = useState(initial?.date ?? today)
  const [time, setTime] = useState(initial?.time ?? '09:00')
  const [alarmEnabled, setAlarmEnabled] = useState(initial?.alarmEnabled ?? true)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (initial) {
      setText(initial.text ?? '')
      setDate(initial.date ?? today)
      setTime(initial.time ?? '09:00')
      setAlarmEnabled(initial.alarmEnabled ?? true)
    }
  }, [initial?.id])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const canSave = (text || '').trim().length > 0 && Boolean(date) && Boolean(time)

  const handleSave = async () => {
    if (!canSave) return
    if (submittingRef.current) return
    submittingRef.current = true

    try {
      // Pedir permiso solo si el usuario quiere alarma.
      if (alarmEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        try {
          await Notification.requestPermission()
        } catch {
          // ignore
        }
      }

      onCreate?.({
        id: initial?.id,
        text: (text || '').trim(),
        date,
        time,
        alarmEnabled,
      })
      onClose?.()
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <div className="add-reminder" role="dialog" aria-label="Crear recordatorio" aria-modal="true">
      <button type="button" className="add-reminder__backdrop" onClick={onClose} aria-label="Cerrar" />
      <div className="add-reminder__sheet">
        <BackButton onClick={onClose} />
        <p className="add-reminder__title">{initial ? 'Editar recordatorio' : 'Nuevo recordatorio'}</p>

        <label className="add-reminder__label" htmlFor="reminder-text">Texto</label>
        <input
          id="reminder-text"
          className="add-reminder__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: Tenés que ir al gym"
          maxLength={120}
        />

        <div className="add-reminder__row">
          <div className="add-reminder__col">
            <label className="add-reminder__label" htmlFor="reminder-date">Día</label>
            <input
              id="reminder-date"
              type="date"
              className="add-reminder__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="add-reminder__col">
            <label className="add-reminder__label" htmlFor="reminder-time">Hora</label>
            <input
              id="reminder-time"
              type="time"
              className="add-reminder__input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <label className="add-reminder__toggle">
          <input
            type="checkbox"
            checked={alarmEnabled}
            onChange={(e) => setAlarmEnabled(e.target.checked)}
          />
          <span className="add-reminder__toggle-text">Alarma</span>
        </label>

        <div className="add-reminder__actions">
          <button type="button" className="add-reminder__btn add-reminder__btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="add-reminder__btn add-reminder__btn--primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddReminderModal

