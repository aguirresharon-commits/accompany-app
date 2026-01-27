// Modal: elegir cuántos minutos dedicar a la tarea (5, 10, 15, 20 u otro)
import { useState, useRef, useEffect } from 'react'
import './TimeSelectModal.css'

const PRESETS = [5, 10, 15, 20] // En minutos

const TimeSelectModal = ({ action, onSelect, onClose }) => {
  const [customMode, setCustomMode] = useState(false)
  const [customSeconds, setCustomSeconds] = useState(10) // 10 segundos por defecto
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
    setSelected(min * 60) // Convertir minutos a segundos
  }

  const handleOtro = () => {
    setCustomMode(true)
    setSelected(customSeconds)
  }

  const handleCustomChange = (e) => {
    const v = parseInt(e.target.value, 10)
    if (!Number.isNaN(v) && v >= 10) {
      setCustomSeconds(v)
      setSelected(v)
    } else {
      setSelected(null)
      if (e.target.value === '') setCustomSeconds(10)
    }
  }

  const handleIncrement = () => {
    const newValue = Math.min(customSeconds + 10, 1200) // Máximo 20 minutos (1200 segundos)
    setCustomSeconds(newValue)
    setSelected(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(customSeconds - 10, 10) // Mínimo 10 segundos
    setCustomSeconds(newValue)
    setSelected(newValue)
  }

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) {
      return `${minutes} min`
    }
    return `${minutes} min ${remainingSeconds}s`
  }

  const handleConfirm = () => {
    const seconds = customMode ? customSeconds : selected
    if (seconds && seconds >= 10 && seconds <= 1200) { // Máximo 20 minutos (1200 segundos)
      // Pasar segundos directamente
      onSelect(seconds)
    }
  }

  const canConfirm = selected != null && selected >= 10

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
        <p className="time-select__title">¿Cuánto tiempo?</p>
        {action?.emoji && (
          <span className="time-select__emoji" aria-hidden="true">{action.emoji}</span>
        )}
        <p className="time-select__task">{action?.text}</p>
        <div className="time-select__presets">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              className={`time-select__btn ${selected === m * 60 && !customMode ? 'time-select__btn--active' : ''}`}
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
              Tiempo (desde 10 segundos)
            </label>
            <div className="time-select__input-wrapper">
              <button
                type="button"
                className="time-select__adjust-btn"
                onClick={handleDecrement}
                aria-label="Reducir tiempo"
              >
                −
              </button>
              <div className="time-select__input-container">
                <input
                  ref={inputRef}
                  id="time-select-input"
                  type="number"
                  min={10}
                  max={1200}
                  step={10}
                  value={customSeconds}
                  onChange={handleCustomChange}
                  className="time-select__input"
                  aria-label="Tiempo personalizado en segundos"
                />
                <span className="time-select__input-display">{formatTime(customSeconds)}</span>
              </div>
              <button
                type="button"
                className="time-select__adjust-btn"
                onClick={handleIncrement}
                aria-label="Aumentar tiempo"
              >
                +
              </button>
            </div>
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
