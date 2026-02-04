// Pantalla dedicada de Premium: beneficios claros y activación
// Se abre al tocar "Activar Premium" o al intentar usar una función Premium
import BackButton from './BackButton'
import './PremiumView.css'

const BENEFITS = [
  'Timer con duración libre: elegí cualquier tiempo (no solo hasta 10 min).',
  'Agregar notas al terminar una tarea.',
  'Ver el detalle de cada día en el calendario (tareas completadas).',
  'Pausar y reanudar tu racha cuando lo necesites.',
  'Recordatorios ilimitados y poder borrarlos.',
]

const PremiumView = ({ isPremium: isPremiumProp, userPlan, onActivate, onClose }) => {
  const isPremium = isPremiumProp !== undefined ? isPremiumProp : userPlan === 'premium'

  return (
    <div className="premium-view">
      <div className="premium-view__inner">
        <BackButton onClick={onClose} />
        <h1 className="premium-view__title">Premium</h1>
        <p className="premium-view__intro">
          {isPremium
            ? 'Tenés Premium activo. Acá podés ver todo lo que incluye.'
            : 'Podés usar Control gratis. Premium desbloquea estas ventajas cuando quieras.'}
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
              <p className="premium-view__hint">
                Podés usar Control gratis. Premium se activa desde tu cuenta cuando quieras.
              </p>
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
