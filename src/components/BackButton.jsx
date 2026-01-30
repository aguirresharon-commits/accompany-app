// Botón volver (←) estandarizado: SIEMPRE esquina superior izquierda del viewport.
// Se renderiza en document.body vía Portal para no quedar dentro de contenedores con transform.
import { createPortal } from 'react-dom'
import './BackButton.css'

const BackButton = ({ onClick, 'aria-label': ariaLabel = 'Volver', className = '' }) => {
  const button = (
    <button
      type="button"
      className={`back-button ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="back-button__icon" aria-hidden>←</span>
    </button>
  )
  return createPortal(button, document.body)
}

export default BackButton
