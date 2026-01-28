// Pantalla informativa de Premium: qué es, funciones desbloqueadas, activar (sin pagos)
import { activatePremium } from '../services/premiumService'
import './PremiumInfoScreen.css'

const PREMIUM_FEATURES = [
  'Tareas inteligentes y personalizadas',
  'Notas con recordatorios',
  'Desbloqueo de límites',
]

const PremiumInfoScreen = ({ user, onOpenLogin, onPremiumActivated }) => {
  const isLoggedIn = Boolean(user?.uid)

  const handleActivate = () => {
    if (isLoggedIn) {
      activatePremium(user.uid)
      onPremiumActivated?.()
    } else {
      onOpenLogin?.()
    }
  }

  return (
    <div className="premium-info">
      <div className="premium-info__inner">
        <h1 className="premium-info__title">Control Premium</h1>
        <p className="premium-info__intro">
          Más control sobre tu ritmo y menos ruido. Premium te da herramientas
          para avanzar a tu manera, sin presión.
        </p>

        <h2 className="premium-info__subtitle">Qué incluye</h2>
        <ul className="premium-info__features" aria-label="Funciones Premium">
          {PREMIUM_FEATURES.map((text, i) => (
            <li key={i} className="premium-info__feature">
              {text}
            </li>
          ))}
        </ul>

        <div className="premium-info__actions">
          <button
            type="button"
            className="premium-info__btn premium-info__btn--primary"
            onClick={handleActivate}
          >
            {isLoggedIn ? 'Activar Premium' : 'Iniciar sesión para activar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PremiumInfoScreen
