// Pantalla de login/registro: email y contraseña. Se abre solo al intentar activar Premium (o desde Ajustes).
// Si el usuario existe → login. Si no existe → se crea la cuenta y queda logueado. Un solo botón "Ingresar".
import { useState, useCallback } from 'react'
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

const mapAuthError = (err) => {
  const code = err?.code
  if (code === 'auth/user-not-found') return 'No hay cuenta con ese email.'
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Contraseña incorrecta.'
  if (code === 'auth/invalid-email') return 'Email inválido.'
  if (code === 'auth/too-many-requests') return 'Demasiados intentos. Probá más tarde.'
  if (code === 'auth/network-request-failed') return 'Error de conexión.'
  if (code === 'auth/weak-password') return 'La contraseña debe tener al menos 6 caracteres.'
  if (code === 'auth/email-already-in-use') return 'Ese email ya está en uso.'
  if (err?.message === 'AUTH_TIMEOUT') return 'Demasiado lento. Probá de nuevo.'
  return err?.message || 'Error al ingresar.'
}

const LoginScreen = ({ onSuccess, onBack }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        // No bloquear el render esperando Firebase/Auth:
        // Cargamos authService solo al enviar, con timeout para evitar loading infinito.
        await withTimeout(
          import('../services/authService').then(({ loginOrRegister }) => loginOrRegister(trimEmail, password)),
          AUTH_LOAD_TIMEOUT_MS
        )
        onSuccess?.()
      } catch (err) {
        setError(mapAuthError(err))
      } finally {
        setLoading(false)
      }
    },
    [email, password, onSuccess]
  )

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
