// Pantalla de login: email y contraseña. Auth vía backend (API + JWT). Sin Firebase.
import { useState, useCallback, useEffect } from 'react'
import logoHead from '../assets/logo-head.png'
import StarryBackground from './StarryBackground'
import BackButton from './BackButton'
import { API_BASE } from '../api/client'
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
  if (msg.includes('15 minutos') || msg.includes('Demasiados intentos de inicio')) return 'Demasiados intentos. Probá en 15 minutos.'
  if (msg.includes('usa Google')) return 'Esta cuenta usa Google. Iniciá sesión con Google.'
  if (msg.includes('incorrectos')) return 'Email o contraseña incorrectos.'
  if (msg.includes('requeridos')) return 'Ingresá email y contraseña.'
  if (msg.includes('al menos 8') || msg.includes('letra y un número')) return 'La contraseña debe tener al menos 8 caracteres, una letra y un número.'
  if (msg.includes('formato válido')) return 'El email no tiene un formato válido.'
  if (msg.includes('ya está en uso') || msg.includes('Ya existe')) return 'Ese email ya está registrado. Revisá tu contraseña.'
  if (msg.includes('red') || msg.includes('conexión') || msg.includes('fetch')) return 'Error de conexión.'
  return msg || 'Error al ingresar.'
}

const LoginScreen = ({
  onSuccess,
  onBack,
  onNavigateToForgotPassword,
  title,
  note,
  createAccountHint
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => {
      import('../services/authService').then(({ getCurrentUser }) => {
        const user = getCurrentUser()
        onSuccess?.(user ? { uid: user.uid, email: user.email } : null)
      })
    }, 2200)
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
        const { loginOrRegister } = await import('../services/authService')
        await withTimeout(loginOrRegister(trimEmail, password), AUTH_LOAD_TIMEOUT_MS)
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
            onClick={() => {
              import('../services/authService').then(({ getCurrentUser }) => {
                const user = getCurrentUser()
                onSuccess?.(user ? { uid: user.uid, email: user.email } : null)
              })
            }}
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
        <h1 className="login__brand">{title || 'CONTROL'}</h1>
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

          <a
            href={`${API_BASE}/api/auth/google`}
            className="login__google-btn"
            aria-label="Continuar con Google"
          >
            <svg className="login__google-icon" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </a>

          {onNavigateToForgotPassword && (
            <p className="login__create-account">
              <button
                type="button"
                className="login__create-account-link"
                onClick={onNavigateToForgotPassword}
                disabled={loading}
              >
                Olvidé mi contraseña
              </button>
            </p>
          )}

          {createAccountHint && (
            <p className="login__create-account">
              ¿No tenés cuenta? Ingresá email y contraseña para crear una (no activa ningún pago).
            </p>
          )}

          {note && <p className="login__hint">{note}</p>}
          {!note && <p className="login__hint">Podés usar Control gratis sin cuenta.</p>}

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
