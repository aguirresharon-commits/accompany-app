// Pantalla de inicio / bienvenida: logo, CONTROL, tagline, "Tomar el control"
import { useCallback } from 'react'
import logoHead from '../assets/logo-head.png'
import StarryBackground from './StarryBackground'
import './WelcomeScreen.css'

const WelcomeScreen = ({ onEnter, isLeaving, onLeaveComplete, currentUser }) => {
  const handleClick = useCallback(() => {
    onEnter?.()
  }, [onEnter])

  const handleTransitionEnd = useCallback(
    (e) => {
      if (isLeaving && e.target === e.currentTarget && e.propertyName === 'opacity') {
        onLeaveComplete?.()
      }
    },
    [isLeaving, onLeaveComplete]
  )

  const isLoggedIn = Boolean(currentUser?.uid)

  return (
    <div
      className={`welcome ${isLeaving ? 'welcome--leave' : ''}`}
      role="region"
      aria-label="Pantalla de bienvenida"
      onTransitionEnd={handleTransitionEnd}
    >
      <StarryBackground />
      <div className="welcome__inner">
        <img
          src={logoHead}
          alt=""
          className="welcome__logo"
          aria-hidden="true"
        />
        <h1 className="welcome__brand">CONTROL</h1>
        <p className="welcome__tagline">Menos ruido. Más claridad.</p>
        {isLoggedIn && (
          <p className="welcome__logged-in">
            Bienvenido de nuevo. Gracias por acompañarnos.
          </p>
        )}
        <button
          type="button"
          className="welcome__cta"
          onClick={handleClick}
          aria-label="Tomar el control"
        >
          Tomar el control
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
