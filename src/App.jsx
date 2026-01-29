import { useState, useCallback, useEffect } from 'react'
import { AppProvider, useAppState } from './context/AppContext'
import EnergyLevelSelector from './components/EnergyLevelSelector'
import ActionScreen from './components/ActionScreen'
import Loader from './components/Loader'
import WelcomeScreen from './components/WelcomeScreen'
import { initAudioContext } from './utils/sounds'

const AppContent = () => {
  const { currentEnergyLevel, isInitialLoading } = useAppState()

  if (!currentEnergyLevel) {
    return (
      <>
        <Loader isLoading={isInitialLoading} />
        {!isInitialLoading && <EnergyLevelSelector />}
      </>
    )
  }

  return (
    <>
      <Loader isLoading={isInitialLoading} />
      {!isInitialLoading && <ActionScreen />}
    </>
  )
}

const AppWithWelcome = () => {
  const [showWelcome, setShowWelcome] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let unsub = () => {}
    import('./services/authService')
      .then(({ getCurrentUser, onAuthChange }) => {
        setCurrentUser(getCurrentUser())
        unsub = onAuthChange((u) => setCurrentUser(u))
      })
      .catch(() => {})
    return () => { try { unsub() } catch (_) {} }
  }, [])

  // Desbloquear audio en el primer toque/clic (necesario en móviles para que suene)
  useEffect(() => {
    const unlock = () => {
      initAudioContext().catch(() => {})
      document.removeEventListener('touchend', unlock, true)
      document.removeEventListener('click', unlock, true)
    }
    document.addEventListener('touchend', unlock, { capture: true, passive: true })
    document.addEventListener('click', unlock, { capture: true })
    return () => {
      document.removeEventListener('touchend', unlock, true)
      document.removeEventListener('click', unlock, true)
    }
  }, [])

  const handleEnter = useCallback(() => {
    setIsLeaving(true)
  }, [])

  const handleLeaveComplete = useCallback(() => {
    setShowWelcome(false)
    setIsLeaving(false)
  }, [])

  return (
    <>
      {(showWelcome || isLeaving) && (
        <WelcomeScreen
          onEnter={handleEnter}
          isLeaving={isLeaving}
          onLeaveComplete={handleLeaveComplete}
          currentUser={currentUser}
        />
      )}
      {!showWelcome && (
        <div className="app-main" role="main">
          <AppContent />
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <AppWithWelcome />
    </AppProvider>
  )
}

export default App
