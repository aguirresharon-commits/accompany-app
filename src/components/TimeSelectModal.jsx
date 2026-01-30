// Modal: elegir cuántos minutos dedicar a la tarea
// FREE: presets cortos (1, 3, 5, 10 min). PREMIUM: 5, 10, 15, 20 + duración libre
import { useState, useRef, useEffect } from 'react'
import { getTaskIcon } from '../data/iconMap'
import TaskIcon from './TaskIcon'
import BackButton from './BackButton'
import './TimeSelectModal.css'

const PRESETS_FREE = [1, 3, 5, 10]   // minutos
const PRESETS_PREMIUM = [5, 10, 15, 20]

const TimeSelectModal = ({ action, onSelect, onClose, isPremium = false, onRequestPremium }) => {
  const PRESETS = isPremium ? PRESETS_PREMIUM : PRESETS_FREE
  const [customMode, setCustomMode] = useState(false)
  const [customSeconds, setCustomSeconds] = useState(isPremium ? 600 : 60)
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
    if (!isPremium) return
    setCustomMode(true)
    setSelected(customSeconds)
  }

  const handleCustomChange = (e) => {
    const raw = e.target.value
    if (raw === '') {
      setCustomSeconds(10)
      setSelected(10)
      return
    }
    const v = parseInt(raw, 10)
    if (Number.isNaN(v) || v < 10) {
      setCustomSeconds(10)
      setSelected(10)
      return
    }
    const clamped = Math.min(Math.max(v, 10), 1200)
    setCustomSeconds(clamped)
    setSelected(clamped)
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
    const safe = seconds != null ? Math.max(10, Math.min(1200, seconds)) : null
    if (safe != null && safe >= 10) {
      onSelect(safe)
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
        <BackButton onClick={onClose} />
        <p className="time-select__title">¿Cuánto tiempo?</p>
        {action?.id && getTaskIcon(action.id) && (
          <TaskIcon iconName={getTaskIcon(action.id)} className="time-select__icon" size={32} />
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
          {isPremium ? (
            <button
              type="button"
              className={`time-select__btn ${customMode ? 'time-select__btn--active' : ''}`}
              onClick={handleOtro}
            >
              Otro
            </button>
          ) : (
            <button
              type="button"
              className="time-select__btn time-select__btn--disabled"
              disabled
              aria-label="Función Premium"
            >
              Función Premium
            </button>
          )}
        </div>
        {!isPremium && onRequestPremium && (
          <div className="time-select__premium-hint-wrap">
            <button
              type="button"
              className="time-select__premium-hint-btn"
              onClick={onRequestPremium}
            >
              Con Premium podés elegir cualquier duración.
            </button>
          </div>
        )}
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
