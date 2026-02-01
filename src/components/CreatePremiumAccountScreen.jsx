// Pantalla Crear cuenta Premium: email, contraseña, confirmación.
// Modo demo: el pago es simulado; no se realiza ningún cobro. Los datos de tarjeta son opcionales.
import { useState, useCallback, useEffect } from 'react'
import logoHead from '../assets/logo-head.png'
import StarryBackground from './StarryBackground'
import BackButton from './BackButton'
import { createPremiumAccount } from '../services/createPremiumAccountService'
import './CreatePremiumAccountScreen.css'

const CreatePremiumAccountScreen = ({ onSuccess, onBack }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => onSuccess?.(), 2500)
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
        setError('Ingresá una contraseña.')
        return
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        return
      }
      if (password !== confirm) {
        setError('La contraseña y la confirmación no coinciden.')
        return
      }
      setLoading(true)
      try {
        const result = await createPremiumAccount({ email: trimEmail, password })
        const { setSession } = await import('../services/authService')
        setSession({ user: result.user, token: result.token })
        setSuccess(true)
      } catch (err) {
        setError(err?.message || 'Error al crear la cuenta.')
      } finally {
        setLoading(false)
      }
    },
    [email, password, confirm, onSuccess]
  )

  if (success) {
    return (
      <div className="create-premium" role="region" aria-label="Cuenta Premium creada">
        <StarryBackground />
        <div className="create-premium__success-inner">
          <p className="create-premium__success-message">Ahora sos Premium. Disfrutá Control.</p>
          <button
            type="button"
            className="create-premium__success-btn"
            onClick={() => onSuccess?.()}
          >
            Continuar
          </button>
          <p className="create-premium__success-hint">Redirigiendo a la app…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="create-premium" role="region" aria-label="Crear cuenta Premium">
      <StarryBackground />
      <BackButton onClick={() => onBack?.()} />
      <div className="create-premium__inner">
        <img src={logoHead} alt="" className="create-premium__logo" aria-hidden="true" />
        <h1 className="create-premium__title">Crear cuenta Premium</h1>
        <p className="create-premium__tagline">Completá el formulario para activar Premium.</p>

        <form className="create-premium__form" onSubmit={handleSubmit} noValidate>
          <section className="create-premium__section" aria-labelledby="create-premium-form-heading">
            <h2 id="create-premium-form-heading" className="create-premium__section-title">
              Cuenta
            </h2>
            <label className="create-premium__label" htmlFor="create-premium-email">
              Email
            </label>
            <input
              id="create-premium-email"
              type="email"
              className="create-premium__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={loading}
            />
            <label className="create-premium__label" htmlFor="create-premium-password">
              Contraseña
            </label>
            <input
              id="create-premium-password"
              type="password"
              className="create-premium__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
            />
            <label className="create-premium__label" htmlFor="create-premium-confirm">
              Confirmar contraseña
            </label>
            <input
              id="create-premium-confirm"
              type="password"
              className="create-premium__input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
            />
          </section>

          <section className="create-premium__section" aria-labelledby="create-premium-payment-heading">
            <h2 id="create-premium-payment-heading" className="create-premium__section-title">
              Pago
            </h2>
            <p className="create-premium__payment-note create-premium__payment-note--demo" role="status">
              <strong>Modo demo.</strong> El pago es simulado; no se realiza ningún cobro. Los datos de tarjeta son opcionales.
            </p>
            <label className="create-premium__label" htmlFor="create-premium-card">
              Número de tarjeta
            </label>
            <input
              id="create-premium-card"
              type="text"
              className="create-premium__input"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              autoComplete="cc-number"
              disabled={loading}
            />
            <div className="create-premium__row">
              <div className="create-premium__field">
                <label className="create-premium__label" htmlFor="create-premium-expiry">
                  Vencimiento
                </label>
                <input
                  id="create-premium-expiry"
                  type="text"
                  className="create-premium__input"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/AA"
                  autoComplete="cc-exp"
                  disabled={loading}
                />
              </div>
              <div className="create-premium__field">
                <label className="create-premium__label" htmlFor="create-premium-cvc">
                  CVC
                </label>
                <input
                  id="create-premium-cvc"
                  type="text"
                  className="create-premium__input"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                  autoComplete="cc-csc"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {error && (
            <p className="create-premium__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="create-premium__submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta Premium'}
          </button>

          {loading && (
            <div className="create-premium__loading" role="status" aria-live="polite">
              <span className="create-premium__loading-spinner" aria-hidden="true" />
              <span className="create-premium__loading-text">Creando cuenta…</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default CreatePremiumAccountScreen
