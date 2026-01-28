// Pantalla de login: email, contraseña, Firebase signInWithEmailAndPassword.
// Exportado pero no conectado a la app todavía.
import { useState, useCallback } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import logoHead from '../assets/logo-head.png'
import StarryBackground from './StarryBackground'
import './LoginScreen.css'

const mapAuthError = (err) => {
  const code = err?.code
  if (code === 'auth/user-not-found') return 'No hay cuenta con ese email.'
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Contraseña incorrecta.'
  if (code === 'auth/invalid-email') return 'Email inválido.'
  if (code === 'auth/too-many-requests') return 'Demasiados intentos. Probá más tarde.'
  if (code === 'auth/network-request-failed') return 'Error de conexión.'
  return err?.message || 'Error al ingresar.'
}

const LoginScreen = ({ onSuccess }) => {
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
        await signInWithEmailAndPassword(auth, trimEmail, password)
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
