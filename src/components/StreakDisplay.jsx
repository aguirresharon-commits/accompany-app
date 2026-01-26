// Componente para mostrar racha de forma empática y discreta
// Rachas humanas que no se rompen, pueden pausarse sin culpa
import { useStreak } from '../hooks/useStreak'
import { useAppState } from '../hooks/useAppState'
import './StreakDisplay.css'

const StreakDisplay = () => {
  const streakInfo = useStreak()
  const { updateStreak } = useAppState()
  const { current, paused, message } = streakInfo

  // Manejar pausar/reanudar racha
  const handleTogglePause = () => {
    updateStreak({ paused: !paused })
  }

  // Solo mostrar si hay racha o si está pausada
  // Si current es 0 y no está pausada, no mostrar (para no presionar)
  if (current === 0 && !paused) {
    return null
  }

  return (
    <div className="streak-display">
      <p className="streak-display__message">{message}</p>
      {current > 0 && (
        <button
          className="streak-display__pause-button"
          onClick={handleTogglePause}
          aria-label={paused ? 'Reanudar racha' : 'Pausar racha'}
          title={paused ? 'Reanudar racha' : 'Pausar racha'}
        >
          {paused ? '▶' : '⏸'}
        </button>
      )}
    </div>
  )
}

export default StreakDisplay
