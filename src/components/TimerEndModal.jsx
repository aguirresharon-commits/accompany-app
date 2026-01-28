// Al finalizar tiempo (o parar): mensaje humano + Marcar completada | Continuar más | Agregar nota (Premium) | Cerrar
import { useEffect } from 'react'
import './TimerEndModal.css'

const CLOSE_MESSAGES = ['Listo.', 'Terminaste.', 'Bien.', 'Listo por ahora.', 'Podés seguir cuando quieras.']

const TimerEndModal = ({
  action,
  onMarkComplete,
  onContinueMore,
  onAddNote,
  onClose,
  isPremium = false,
  onRequestPremium,
}) => {
  const msg = CLOSE_MESSAGES[Math.floor(Math.random() * CLOSE_MESSAGES.length)]

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="timer-end" role="dialog" aria-label="Tiempo finalizado" aria-modal="true">
      <button
        type="button"
        className="timer-end__backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <button
        type="button"
        className="timer-end__back"
        onClick={onClose}
        aria-label="Volver"
      >
        ←
      </button>
      <div className="timer-end__sheet">
        <p className="timer-end__message">{msg}</p>
        <div className="timer-end__actions">
          <button
            type="button"
            className="timer-end__btn timer-end__btn--primary"
            onClick={onMarkComplete}
            aria-label="Marcar tarea como completada"
          >
            Marcar completada
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
              <button
                type="button"
                className="timer-end__btn timer-end__btn--secondary"
                disabled
                aria-label="Función Premium"
              >
                Función Premium
              </button>
              {onRequestPremium && (
                <button
                  type="button"
                  className="timer-end__premium-hint-btn"
                  onClick={onRequestPremium}
                >
                  Con Premium podés agregar notas al finalizar.
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
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimerEndModal
