// Modal para activar Premium: solo se muestra al tocar "Hacerse Premium"
// No se pide login al iniciar la app
import { useEffect } from 'react'
import './UpgradeModal.css'

const UpgradeModal = ({ onConfirm, onClose }) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="upgrade-modal" role="dialog" aria-labelledby="upgrade-modal-title" aria-modal="true">
      <button
        type="button"
        className="upgrade-modal__backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <button
        type="button"
        className="upgrade-modal__back"
        onClick={onClose}
        aria-label="Volver"
      >
        ←
      </button>
      <div className="upgrade-modal__sheet">
        <h2 id="upgrade-modal-title" className="upgrade-modal__title">Premium</h2>
        <p className="upgrade-modal__text">Desbloqueá:</p>
        <ul className="upgrade-modal__list" aria-label="Ventajas Premium">
          <li>Timer con duración libre (cualquier tiempo)</li>
          <li>Notas al terminar una tarea</li>
          <li>Detalle de cada día en el calendario</li>
          <li>Pausar y reanudar la racha</li>
          <li>Recordatorios ilimitados y poder borrarlos</li>
        </ul>
        <p className="upgrade-modal__text upgrade-modal__text--small">Iniciá sesión y activá Premium.</p>
        <div className="upgrade-modal__actions">
          <button
            type="button"
            className="upgrade-modal__btn upgrade-modal__btn--secondary"
            onClick={onClose}
          >
            Más tarde
          </button>
          <button
            type="button"
            className="upgrade-modal__btn upgrade-modal__btn--primary"
            onClick={onConfirm}
            aria-label="Activar Premium"
          >
            Activar Premium
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal
