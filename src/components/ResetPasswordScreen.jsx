// Pantalla "Restablecer contraseña": token + nueva contraseña → POST /api/auth/reset-password
import { useState, useCallback, useEffect } from 'react'
import StarryBackground from './StarryBackground'
import BackButton from './BackButton'
import { apiFetch } from '../api/client'
import './ResetPasswordScreen.css'

function getInitialToken() {
  try {
    return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('token') || ''
  } catch {
    return ''
  }
}

const ResetPasswordScreen = ({ onBack }) => {
  const [token, setToken] = useState(getInitialToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const t = getInitialToken()
    if (t) setToken(t)
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setError('')
      const trimToken = (token || '').trim()
      if (!trimToken) {
        setError('Ingresá el token que recibiste por email.')
        return
      }
      if (!newPassword || newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
        setError('La contraseña debe tener al menos 8 caracteres, una letra y un número.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden.')
        return
      }
      setLoading(true)
      try {
        const { ok, data } = await apiFetch('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: trimToken, newPassword })
        })
        if (!ok && data?.error) {
          setError(data.error)
          return
        }
        setSuccess(true)
      } catch (err) {
        const msg = err?.message || ''
        if (msg.includes('conexión') || msg.includes('fetch')) setError('Error de conexión.')
        else setError(msg || 'No se pudo restablecer. Probá de nuevo.')
      } finally {
        setLoading(false)
      }
    },
    [token, newPassword, confirmPassword]
  )

  if (success) {
    return (
      <div className="reset-password reset-password--success" role="region" aria-label="Contraseña actualizada">
        <StarryBackground />
        <div className="reset-password__inner">
          <h1 className="reset-password__title">Contraseña actualizada</h1>
          <p className="reset-password__message">Podés iniciar sesión con tu nueva contraseña.</p>
          <button type="button" className="reset-password__submit" onClick={onBack}>
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password" role="region" aria-label="Restablecer contraseña">
      <StarryBackground />
      <BackButton onClick={onBack} />
      <div className="reset-password__inner">
        <h1 className="reset-password__title">Nueva contraseña</h1>
        <p className="reset-password__tagline">Ingresá el token que recibiste y elegí una contraseña nueva.</p>

        <form className="reset-password__form" onSubmit={handleSubmit} noValidate>
          <label className="reset-password__label" htmlFor="reset-token">
            Token
          </label>
          <input
            id="reset-token"
            type="text"
            className="reset-password__input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Pegá aquí el token del correo"
            autoComplete="one-time-code"
            disabled={loading}
          />

          <label className="reset-password__label" htmlFor="reset-new-password">
            Nueva contraseña
          </label>
          <div className="reset-password__password-wrap">
            <input
              id="reset-new-password"
              type={isPasswordVisible ? 'text' : 'password'}
              className="reset-password__input reset-password__input--password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mín. 8 caracteres, letra y número"
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className="reset-password__password-toggle"
              onClick={() => setIsPasswordVisible((v) => !v)}
              aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {isPasswordVisible ? (
                <svg className="reset-password__password-toggle-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              ) : (
                <svg className="reset-password__password-toggle-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27L4.28 6.55 4.73 7C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z" />
                </svg>
              )}
            </button>
          </div>

          <label className="reset-password__label" htmlFor="reset-confirm-password">
            Repetir contraseña
          </label>
          <input
            id="reset-confirm-password"
            type={isPasswordVisible ? 'text' : 'password'}
            className="reset-password__input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repetí la contraseña"
            autoComplete="new-password"
            disabled={loading}
          />

          {error && (
            <p className="reset-password__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="reset-password__submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Guardando…' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordScreen
