// Pantalla "Olvidé mi contraseña": email → POST /api/auth/forgot-password
import { useState, useCallback } from 'react'
import StarryBackground from './StarryBackground'
import BackButton from './BackButton'
import { apiFetch, API_BASE } from '../api/client'
import './ForgotPasswordScreen.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function isValidEmail(str) {
  return typeof str === 'string' && EMAIL_REGEX.test(str.trim())
}

const ForgotPasswordScreen = ({ onBack, onNavigateToReset }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setError('')
      const trimEmail = (email || '').trim().toLowerCase()
      if (!trimEmail) {
        setError('Ingresá tu email.')
        return
      }
      if (!isValidEmail(trimEmail)) {
        setError('El email no tiene un formato válido.')
        return
      }
      setLoading(true)
      try {
        const { ok, data } = await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: trimEmail })
        })
        if (!ok && data?.error) {
          setError(data.error)
          return
        }
        setSent(true)
      } catch (err) {
        const msg = err?.message || ''
        if (msg.includes('conexión') || msg.includes('fetch')) setError('Error de conexión.')
        else setError(msg || 'No se pudo enviar. Probá de nuevo.')
      } finally {
        setLoading(false)
      }
    },
    [email]
  )

  if (sent) {
    return (
      <div className="forgot-password forgot-password--success" role="region" aria-label="Instrucciones enviadas">
        <StarryBackground />
        <BackButton onClick={onBack} />
        <div className="forgot-password__inner">
          <h1 className="forgot-password__title">Revisá tu correo</h1>
          <p className="forgot-password__message">
            Si el email existe en nuestra base, te enviamos un correo con un enlace para restablecer la contraseña. Revisá también la carpeta de spam.
          </p>
          {onNavigateToReset && (
            <p className="forgot-password__hint">
              Si no te llegó el correo o preferís pegar el código manualmente:
            </p>
          )}
          {onNavigateToReset && (
            <button
              type="button"
              className="forgot-password__link"
              onClick={onNavigateToReset}
            >
              Ya tengo el token, restablecer contraseña
            </button>
          )}
          <button type="button" className="forgot-password__submit" onClick={onBack}>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password" role="region" aria-label="Recuperar contraseña">
      <StarryBackground />
      <BackButton onClick={onBack} />
      <div className="forgot-password__inner">
        <h1 className="forgot-password__title">Olvidé mi contraseña</h1>
        <p className="forgot-password__tagline">Ingresá tu email y te enviamos instrucciones.</p>

        <form className="forgot-password__form" onSubmit={handleSubmit} noValidate>
          <label className="forgot-password__label" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            className="forgot-password__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            disabled={loading}
          />

          {error && (
            <p className="forgot-password__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="forgot-password__submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Enviando…' : 'Enviar instrucciones'}
          </button>

          <a
            href={`${API_BASE}/api/auth/google`}
            className="forgot-password__google-btn"
            aria-label="Recuperar contraseña con Google"
          >
            <svg className="forgot-password__google-icon" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Recuperar contraseña con Google
          </a>
        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordScreen
