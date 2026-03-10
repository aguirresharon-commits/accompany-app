// Pantalla de introducción: CONTROL, tagline, texto explicativo, botón Continuar
import { useCallback } from 'react'
import StarryBackground from './StarryBackground'
import './IntroScreen.css'

const IntroScreen = ({ onContinue }) => {
  const handleClick = useCallback(() => {
    onContinue?.()
  }, [onContinue])

  return (
    <div
      className="intro"
      role="region"
      aria-label="Introducción"
    >
      <StarryBackground />
      <div className="intro__inner">
        <h1 className="intro__brand">CONTROL</h1>
        <p className="intro__tagline">Menos ruido. Más claridad.</p>
        <div className="intro__body">
          <p>Pequeñas acciones diarias crean grandes cambios.</p>
          <p>
            Esta app te ayuda a mantener disciplina con hábitos simples para tu mente, tu cuerpo y tu día.
          </p>
          <p>
            No se trata de hacer mucho.<br />
            Se trata de aparecer todos los días.
          </p>
        </div>
        <button
          type="button"
          className="intro__cta"
          onClick={handleClick}
          aria-label="Continuar"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

export default IntroScreen
