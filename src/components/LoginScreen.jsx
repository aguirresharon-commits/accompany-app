// Pantalla de login: email y contraseña. Auth vía backend (API + JWT). Sin Firebase.
import { useState, useCallback, useEffect } from 'react'
import logoHead from '../assets/logo-head.png'
import StarryBackground from './StarryBackground'
import './LoginScreen.css'

const AUTH_LOAD_TIMEOUT_MS = 8000

function withTimeout(promise, ms) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('AUTH_TIMEOUT')), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId)
  })
}

function mapAuthError(err) {
  const msg = err?.message || ''
  if (msg.includes('AUTH_TIMEOUT') || msg.includes('Demasiado lento')) return 'Demasiado lento. Probá de nuevo.'
  if (msg.includes('incorrectos')) return 'Email o contraseña incorrectos.'
  if (msg.includes('requeridos')) return 'Ingresá email y contraseña.'
  if (msg.includes('al menos 6')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('ya está en uso') || msg.includes('Ya existe')) return 'Ese email ya está en uso.'
  if (msg.includes('red') || msg.includes('conexión') || msg.includes('fetch')) return 'Error de conexión.'
  return msg || 'Error al ingresar.'
}

const LoginScreen = ({ onSuccess, onBack, onNavigateToCreatePremium }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => onSuccess?.(), 2200)
    return () => clearTimeout(t)
  }, [success, onSuccess])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setError('')
      const trimEmail = (email || '').trim()
      if (!trimEmail) {
        setError('Ingresá tu email.')
        return
      }
      if (!(password || '').trim()) {
        setError('Ingresá tu contraseña.')
        return
      }
      setLoading(true)
      try {
        const { login } = await import('../services/authService')
        await withTimeout(login(trimEmail, password), AUTH_LOAD_TIMEOUT_MS)
        setSuccess(true)
      } catch (err) {
        setError(mapAuthError(err))
      } finally {
        setLoading(false)
      }
    },
    [email, password]
  )

  if (success) {
    return (
      <div className="login login--success" role="region" aria-label="Sesión iniciada">
        <StarryBackground />
        <div className="login__success-inner">
          <p className="login__success-message">Sesión iniciada correctamente.</p>
          <p className="login__success-hint">Redirigiendo a la app…</p>
          <button
            type="button"
            className="login__success-btn"
            onClick={() => onSuccess?.()}
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login" role="region" aria-label="Iniciar sesión">
      <StarryBackground />
      <button
        type="button"
        className="login__back"
        onClick={() => onBack?.()}
        aria-label="Volver"
      >
        ←
      </button>
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
            disabled={loading}
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
            autoComplete="current-password"
            disabled={loading}
          />

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login__submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          {onNavigateToCreatePremium && (
            <p className="login__create-account">
              ¿No tenés cuenta?{' '}
              <button
                type="button"
                className="login__create-account-link"
                onClick={onNavigateToCreatePremium}
                disabled={loading}
              >
                Crear cuenta Premium
              </button>
            </p>
          )}

          <p className="login__hint">Podés usar Control gratis sin cuenta.</p>

          {loading && (
            <div className="login__loading" role="status" aria-live="polite">
              <span className="login__loading-spinner" aria-hidden="true" />
              <span className="login__loading-text">Ingresando…</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default LoginScreen
