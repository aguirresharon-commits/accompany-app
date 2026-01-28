// Pantalla de login/registro: email, contraseña, persistencia de sesión
import { useState, useCallback } from 'react'
import logoHead from '../assets/logo-head.png'
import StarryBackground from './StarryBackground'
import './LoginScreen.css'

const LoginScreen = ({ onLogin, onSignUp, authError }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setLocalError('')
      const trimEmail = (email || '').trim()
      if (!trimEmail) {
        setLocalError('Ingresá tu email.')
        return
      }
      if (!(password || '').trim()) {
        setLocalError('Ingresá tu contraseña.')
        return
      }
      if (password.length < 6 && isSignUp) {
        setLocalError('La contraseña debe tener al menos 6 caracteres.')
        return
      }
      setSubmitting(true)
      try {
        if (isSignUp) {
          await onSignUp(trimEmail, password)
        } else {
          await onLogin(trimEmail, password)
        }
      } catch (err) {
        const msg =
          err?.code === 'auth/user-not-found'
            ? 'No hay cuenta con ese email.'
            : err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
              ? 'Contraseña incorrecta.'
              : err?.code === 'auth/email-already-in-use'
                ? 'Ese email ya está en uso.'
                : err?.message || 'Error al iniciar sesión.'
        setLocalError(msg)
      } finally {
        setSubmitting(false)
      }
    },
    [email, password, isSignUp, onLogin, onSignUp]
  )

  const error = authError || localError
  const busy = submitting

  return (
    <div className="login" role="region" aria-label="Iniciar sesión">
      <StarryBackground />
      <div className="login__inner">
        <img src={logoHead} alt="" className="login__logo" aria-hidden="true" />
        <h1 className="login__brand">CONTROL</h1>
        <p className="login__tagline">Menos ruido. Más claridad.</p>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <label className="login__label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className="login__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            disabled={busy}
          />

          <label className="login__label" htmlFor="login-password">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            className="login__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={6}
            disabled={busy}
          />

          {error && <p className="login__error" role="alert">{error}</p>}

          <button
            type="submit"
            className="login__submit"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'Un momento…' : isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <button
          type="button"
          className="login__toggle"
          onClick={() => {
            setIsSignUp((v) => !v)
            setLocalError('')
          }}
          disabled={busy}
        >
          {isSignUp ? 'Ya tengo cuenta' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  )
}

export default LoginScreen
