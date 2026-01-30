// Pantalla de login: email y contraseña. Auth vía backend (API + JWT). Sin Firebase.
import { useState, useCallback, useEffect } from 'react'
import logoHead from '../assets/logo-head.png'
import StarryBackground from './StarryBackground'
import BackButton from './BackButton'
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
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
      <BackButton onClick={() => onBack?.()} />
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
          <div className="login__password-wrap">
            <input
              id="login-password"
              type={isPasswordVisible ? 'text' : 'password'}
              className="login__input login__input--password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              className="login__password-toggle"
              onClick={() => setIsPasswordVisible((v) => !v)}
              aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {isPasswordVisible ? (
                <svg className="login__password-toggle-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              ) : (
                <svg className="login__password-toggle-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27L4.28 6.55 4.73 7C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                </svg>
              )}
            </button>
          </div>

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
