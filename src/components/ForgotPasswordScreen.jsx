// Pantalla "Olvidé mi contraseña": email → POST /api/auth/forgot-password
import { useState, useCallback } from 'react'
import StarryBackground from './StarryBackground'
import BackButton from './BackButton'
import { apiFetch } from '../api/client'
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
        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordScreen
