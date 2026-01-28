// Pantalla dedicada de Premium: beneficios claros y activación
// Se abre al tocar "Activar Premium" o al intentar usar una función Premium
import './PremiumView.css'

const BENEFITS = [
  'Con Premium podés ver tu historial y el calendario de días anteriores.',
  'Con Premium podés usar el timer sin límites y agregar notas al finalizar.',
  'Con Premium podés pausar y proteger tu racha cuando lo necesites.',
  'Con Premium podés acceder a todas las funciones avanzadas de la app.',
]

const PremiumView = ({ userPlan, onActivate, onClose }) => {
  const isPremium = userPlan === 'premium'

  return (
    <div className="premium-view">
      <div className="premium-view__inner">
        <h1 className="premium-view__title">Premium</h1>
        <p className="premium-view__intro">
          {isPremium
            ? 'Tenés Premium activo. Acá podés ver todo lo que incluye.'
            : 'Desbloqueá más control sobre tu ritmo y tu historial.'}
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
              <p className="premium-view__badge">Premium activo</p>
              <button
                type="button"
                className="premium-view__btn premium-view__btn--secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="premium-view__btn premium-view__btn--primary"
                onClick={onActivate}
              >
                Activar Premium
              </button>
              <button
                type="button"
                className="premium-view__btn premium-view__btn--ghost"
                onClick={onClose}
              >
                Más tarde
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PremiumView
