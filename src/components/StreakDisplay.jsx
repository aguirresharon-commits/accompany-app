// Componente para mostrar racha de forma empática y discreta
// FREE: solo ver. PREMIUM: pausar/reanudar (premiumService + authService)
import { useEffect, useState } from 'react'
import { useStreak } from '../hooks/useStreak'
import { useAppState } from '../hooks/useAppState'
import { isPremium as checkIsPremium } from '../services/premiumService'
import './StreakDisplay.css'

const StreakDisplay = () => {
  const streakInfo = useStreak()
  const { updateStreak } = useAppState()
  const { current, paused, message } = streakInfo
  const [currentUser, setCurrentUser] = useState(null)
  useEffect(() => {
    let unsubscribe = () => {}
    let cancelled = false
    import('../services/authService')
      .then(({ getCurrentUser, onAuthChange }) => {
        if (cancelled) return
        setCurrentUser(getCurrentUser())
        unsubscribe = onAuthChange((u) => {
          if (!cancelled) setCurrentUser(u)
        })
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null)
      })
    return () => {
      cancelled = true
      try {
        unsubscribe?.()
      } catch {
        // ignore
      }
    }
  }, [])

  const isPremium = currentUser ? checkIsPremium(currentUser.uid) : false

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
        <span className="streak-display__premium-hint">Función Premium</span>
      )}
    </div>
  )
}

export default StreakDisplay
