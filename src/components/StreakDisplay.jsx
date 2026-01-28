// Componente para mostrar racha de forma empática y discreta
// FREE: solo ver. PREMIUM: pausar/reanudar
import { useStreak } from '../hooks/useStreak'
import { useAppState } from '../hooks/useAppState'
import './StreakDisplay.css'

const StreakDisplay = () => {
  const streakInfo = useStreak()
  const { updateStreak, userPlan } = useAppState()
  const { current, paused, message } = streakInfo
  const isPremium = userPlan === 'premium'

  const handleTogglePause = () => {
    if (!isPremium) return
    updateStreak({ paused: !paused })
  }

  if (current === 0 && !paused) {
    return null
  }

  return (
    <div className="streak-display">
      <p className="streak-display__message">{message}</p>
      {current > 0 && isPremium && (
        <button
          className="streak-display__pause-button"
          onClick={handleTogglePause}
          aria-label={paused ? 'Reanudar racha' : 'Pausar racha'}
          title={paused ? 'Reanudar racha' : 'Pausar racha'}
        >
          {paused ? '▶' : '⏸'}
        </button>
      )}
      {current > 0 && !isPremium && (
        <span className="streak-display__premium-hint">Con Premium podés pausar la racha.</span>
      )}
    </div>
  )
}

export default StreakDisplay
