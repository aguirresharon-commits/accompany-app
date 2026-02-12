// Pantalla dedicada de Premium: beneficios, planes (semanal/mensual) y gestión de suscripción
import { useState, useEffect, useCallback } from 'react'
import BackButton from './BackButton'
import { apiFetch } from '../api/client'
import './PremiumView.css'

const BENEFITS = [
  'Timer con duración libre: elegí cualquier tiempo (no solo hasta 10 min).',
  'Agregar notas al terminar una tarea.',
  'Ver el detalle de cada día en el calendario (tareas completadas).',
  'Pausar y reanudar tu racha cuando lo necesites.',
  'Recordatorios ilimitados y poder borrarlos.',
]

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return iso
  }
}

const PLAN_LABELS = { weekly: 'Semanal', monthly: 'Mensual', annual: 'Anual' }
const PLAN_PRICES = { weekly: '$2.99', monthly: '$9.99', annual: '$79.99' }

const PremiumView = ({ isPremium: isPremiumProp, userPlan, onActivate, onClose, onRefreshPremium }) => {
  const [loading, setLoading] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [error, setError] = useState(null)
  const [details, setDetails] = useState(null)
  const [canceling, setCanceling] = useState(false)
  const [trialConfirmPlan, setTrialConfirmPlan] = useState(null)
  const isPremium = isPremiumProp !== undefined ? isPremiumProp : userPlan === 'premium'

  const fetchDetails = useCallback(async () => {
    if (!isPremium) return
    setLoading(true)
    try {
      const { ok, data } = await apiFetch('/api/premium')
      if (ok && data?.premium) {
        setDetails({
          plan: data.plan,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd
        })
      }
    } catch {
      setDetails(null)
    } finally {
      setLoading(false)
    }
  }, [isPremium])

  useEffect(() => {
    if (isPremium) fetchDetails()
    else setDetails(null)
  }, [isPremium, fetchDetails])

  const handleActivate = async (plan) => {
    if (!onActivate) return
    setTrialConfirmPlan(null)
    setLoadingPlan(plan)
    setError(null)
    try {
      await onActivate(plan)
    } catch (e) {
      setError(e?.message || 'No se pudo iniciar el pago.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('¿Querés cancelar la renovación automática? Vas a seguir teniendo Premium hasta el final del período ya pagado.')) return
    setCanceling(true)
    setError(null)
    try {
      const { ok, data } = await apiFetch('/api/premium/cancel', { method: 'POST' })
      if (ok) {
        setDetails(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null)
        onRefreshPremium?.()
      } else {
        setError(data?.error || 'No se pudo cancelar.')
      }
    } catch (e) {
      setError(e?.message || 'No se pudo cancelar.')
    } finally {
      setCanceling(false)
    }
  }

  const planLabel = details?.plan === 'weekly' ? 'Semanal' : details?.plan === 'monthly' ? 'Mensual' : details?.plan === 'annual' ? 'Anual' : null

  return (
    <div className="premium-view">
      <div className="premium-view__inner">
        <BackButton onClick={onClose} />
        <h1 className="premium-view__title">Premium</h1>
        <p className="premium-view__intro">
          {isPremium
            ? 'Tenés Premium activo. Acá podés ver todo lo que incluye y gestionar tu suscripción.'
            : 'Podés usar Control gratis. Premium desbloquea estas ventajas con suscripción semanal, mensual o anual.'}
        </p>

        <ul className="premium-view__benefits" aria-label="Beneficios de Premium">
          {BENEFITS.map((text, i) => (
            <li key={i} className="premium-view__benefit">
              {text}
            </li>
          ))}
        </ul>

        <div className="premium-view__actions">
          {isPremium ? (
            <>
              {loading ? (
                <p className="premium-view__hint">Cargando…</p>
              ) : details ? (
                <>
                  <p className="premium-view__badge">Premium activo</p>
                  {planLabel && (
                    <p className="premium-view__plan-info">
                      Plan {planLabel} · Vence el {formatDate(details.currentPeriodEnd)}
                    </p>
                  )}
                  {details.cancelAtPeriodEnd ? (
                    <p className="premium-view__hint">
                      La renovación ya está cancelada. Tenés Premium hasta el {formatDate(details.currentPeriodEnd)}.
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="premium-view__btn premium-view__btn--secondary"
                      onClick={handleCancel}
                      disabled={canceling}
                    >
                      {canceling ? 'Cancelando…' : 'Cancelar renovación automática'}
                    </button>
                  )}
                </>
              ) : null}
              {error && <p className="premium-view__error" role="alert">{error}</p>}
              <button
                type="button"
                className="premium-view__btn premium-view__btn--ghost"
                onClick={onClose}
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <p className="premium-view__trial-message">
                Prueba gratuita de 2 días: no hay cobro durante la prueba. La suscripción comienza automáticamente al finalizar la prueba si no la cancelás antes.
              </p>
              <p className="premium-view__hint premium-view__hint--renewal">
                La suscripción se renueva automáticamente. Podés cancelar cuando quieras y seguís teniendo Premium hasta el final del período.
              </p>
              <p className="premium-view__payment-info">
                Pago seguro con tarjeta a través de Stripe. Serás redirigido a la pasarela de pago.
              </p>
              <div className="premium-view__plans">
                <button
                  type="button"
                  className="premium-view__plan-btn"
                  onClick={() => setTrialConfirmPlan('weekly')}
                  disabled={loadingPlan !== null}
                >
                  <span className="premium-view__plan-name">Semanal</span>
                  <span className="premium-view__plan-price">$2.99</span>
                  <span className="premium-view__plan-desc">Cada 7 días</span>
                  {loadingPlan === 'weekly' ? 'Redirigiendo…' : 'Elegir'}
                </button>
                <button
                  type="button"
                  className="premium-view__plan-btn"
                  onClick={() => setTrialConfirmPlan('monthly')}
                  disabled={loadingPlan !== null}
                >
                  <span className="premium-view__plan-name">Mensual</span>
                  <span className="premium-view__plan-price">$9.99</span>
                  <span className="premium-view__plan-desc">Cada 30 días</span>
                  {loadingPlan === 'monthly' ? 'Redirigiendo…' : 'Elegir'}
                </button>
                <button
                  type="button"
                  className="premium-view__plan-btn premium-view__plan-btn--highlight"
                  onClick={() => setTrialConfirmPlan('annual')}
                  disabled={loadingPlan !== null}
                >
                  <span className="premium-view__plan-badge">Mejor valor</span>
                  <span className="premium-view__plan-name">Anual</span>
                  <span className="premium-view__plan-price">$79.99</span>
                  <span className="premium-view__plan-desc">Cada 12 meses</span>
                  {loadingPlan === 'annual' ? 'Redirigiendo…' : 'Elegir'}
                </button>
              </div>
              {trialConfirmPlan && (
                <div className="premium-view__trial-confirm" role="dialog" aria-labelledby="trial-confirm-title" aria-modal="true">
                  <p id="trial-confirm-title" className="premium-view__trial-confirm-title">
                    ¿Activar prueba gratuita de 2 días?
                  </p>
                  <p className="premium-view__trial-confirm-desc">
                    No hay cobro durante la prueba. Al finalizar los 2 días, comenzará la suscripción al plan {PLAN_LABELS[trialConfirmPlan]} ({PLAN_PRICES[trialConfirmPlan]}) si no la cancelás antes.
                  </p>
                  <div className="premium-view__trial-confirm-actions">
                    <button
                      type="button"
                      className="premium-view__btn premium-view__btn--ghost"
                      onClick={() => setTrialConfirmPlan(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="premium-view__btn premium-view__btn--primary"
                      onClick={() => handleActivate(trialConfirmPlan)}
                    >
                      Activar prueba gratuita
                    </button>
                  </div>
                </div>
              )}
              {error && <p className="premium-view__error" role="alert">{error}</p>}
              <button
                type="button"
                className="premium-view__btn premium-view__btn--ghost"
                onClick={onClose}
                disabled={loadingPlan !== null}
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PremiumView
