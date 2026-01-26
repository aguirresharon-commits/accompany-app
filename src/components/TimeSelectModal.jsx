// Modal: elegir cuántos minutos dedicar a la tarea (5, 10, 15, 20 u otro)
import { useState, useRef, useEffect } from 'react'
import './TimeSelectModal.css'

const PRESETS = [5, 10, 15, 20]

const TimeSelectModal = ({ action, onSelect, onClose }) => {
  const [customMode, setCustomMode] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(25)
  const [selected, setSelected] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (customMode) inputRef.current?.focus()
  }, [customMode])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handlePreset = (min) => {
    setCustomMode(false)
    setSelected(min)
  }

  const handleOtro = () => {
    setCustomMode(true)
    setSelected(customMinutes)
  }

  const handleCustomChange = (e) => {
    const v = parseInt(e.target.value, 10)
    if (!Number.isNaN(v) && v >= 1 && v <= 60) {
      setCustomMinutes(v)
      setSelected(v)
    } else {
      setSelected(null)
      if (e.target.value === '') setCustomMinutes(25)
    }
  }

  const handleConfirm = () => {
    const min = customMode ? customMinutes : selected
    if (min && min >= 1 && min <= 60) {
      onSelect(min)
    }
  }

  const canConfirm = selected != null && selected >= 1 && selected <= 60

  if (!action) return null

  return (
    <div className="time-select" role="dialog" aria-label="Elegir minutos" aria-modal="true">
      <button
        type="button"
        className="time-select__backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="time-select__sheet">
        <p className="time-select__title">¿Cuántos minutos?</p>
        {action?.emoji && (
          <span className="time-select__emoji" aria-hidden="true">{action.emoji}</span>
        )}
        <p className="time-select__task">{action?.text}</p>
        <div className="time-select__presets">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              className={`time-select__btn ${selected === m && !customMode ? 'time-select__btn--active' : ''}`}
              onClick={() => handlePreset(m)}
            >
              {m} min
            </button>
          ))}
          <button
            type="button"
            className={`time-select__btn ${customMode ? 'time-select__btn--active' : ''}`}
            onClick={handleOtro}
          >
            Otro
          </button>
        </div>
        {customMode && (
          <div className="time-select__custom">
            <label className="time-select__label" htmlFor="time-select-input">
              Minutos (1–60)
            </label>
            <input
              ref={inputRef}
              id="time-select-input"
              type="number"
              min={1}
              max={60}
              value={customMinutes}
              onChange={handleCustomChange}
              className="time-select__input"
              aria-label="Minutos personalizados"
            />
          </div>
        )}
        <div className="time-select__actions">
          <button
            type="button"
            className="time-select__secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="time-select__primary"
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-label="Comenzar temporizador"
          >
            Empezar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimeSelectModal
