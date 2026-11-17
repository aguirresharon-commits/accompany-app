// Al finalizar tiempo (o parar): mensaje humano + Marcar completada | Continuar más | Agregar nota (Premium) | Cerrar
import { useEffect } from 'react'
import ControlSpark from './ControlSpark'
import './TimerEndModal.css'

const TimerEndModal = ({
  stopped = false,
  onMarkComplete,
  onContinueMore,
  onAddNote,
  onClose,
  isPremium = false,
  onRequestPremium,
}) => {
  const msg = stopped ? 'Temporizador detenido' : 'Tiempo finalizado'

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="timer-end" role="dialog" aria-labelledby="timer-end-title" aria-modal="true">
      <button
        type="button"
        className="timer-end__backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="timer-end__sheet">
        {stopped && <div className="timer-end__spark"><ControlSpark state="stopped" /></div>}
        <h2 id="timer-end-title" className="timer-end__message">{msg}</h2>
        <div className="timer-end__actions">
          <button
            type="button"
            className="timer-end__btn timer-end__btn--primary"
            onClick={onMarkComplete}
            aria-label="Marcar tarea como completada"
          >
            Marcar como completada
          </button>
          <button
            type="button"
            className="timer-end__btn timer-end__btn--secondary"
            onClick={onContinueMore}
            aria-label="Continuar un poco más"
          >
            Continuar un poco más
          </button>
          {isPremium ? (
            <button
              type="button"
              className="timer-end__btn timer-end__btn--secondary"
              onClick={onAddNote}
              aria-label="Agregar nota opcional"
            >
              Agregar nota
            </button>
          ) : (
            <>
              <span className="timer-end__premium-label">Función Premium</span>
              {onRequestPremium && (
                <button
                  type="button"
                  className="timer-end__premium-hint-btn"
                  onClick={onRequestPremium}
                >
                  Ver Premium
                </button>
              )}
            </>
          )}
          <button
            type="button"
            className="timer-end__btn timer-end__btn--ghost"
            onClick={onClose}
            aria-label="Cerrar sin hacer nada"
          >
            Volver a la tarea
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimerEndModal
