import { useState, useCallback, useEffect } from 'react'
import { AppProvider, useAppState } from './context/AppContext'
import EnergyLevelSelector from './components/EnergyLevelSelector'
import ActionScreen from './components/ActionScreen'
import Loader from './components/Loader'
import WelcomeScreen from './components/WelcomeScreen'
import { initAudioContext } from './utils/sounds'

const ONBOARDING_SEEN_KEY = 'control-app-onboarding-energy-seen'

const AppContent = () => {
  const { currentEnergyLevel, isInitialLoading, syncError, clearSyncError } = useAppState()
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.localStorage?.getItem(ONBOARDING_SEEN_KEY) === '1'
    } catch {
      return false
    }
  })

  const handleOnboardingDismiss = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ONBOARDING_SEEN_KEY, '1')
      }
    } catch {}
    setOnboardingDone(true)
  }, [])

  const syncBanner = syncError ? (
    <div
      role="alert"
      style={{
        padding: '0.5rem 1rem',
        background: '#3d1a4a',
        color: '#f0e6f0',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}
    >
      <span>{syncError}</span>
      <button
        type="button"
        onClick={clearSyncError}
        aria-label="Cerrar"
        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.25rem' }}
      >
        ×
      </button>
    </div>
  ) : null

  if (!currentEnergyLevel) {
    const showOnboarding = !isInitialLoading && !onboardingDone
    return (
      <>
        {syncBanner}
        <Loader isLoading={isInitialLoading} />
        {!isInitialLoading && showOnboarding && (
          <div
            className="app-onboarding"
            role="region"
            aria-label="Primeros pasos"
            style={{
              padding: 'var(--spacing-lg, 1.5rem)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-md, 1rem)',
              maxWidth: '360px',
              margin: '0 auto'
            }}
          >
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '1rem', lineHeight: 1.5 }}>
              Elegí cómo te sentís hoy. La app te sugiere una acción a la vez.
            </p>
            <button
              type="button"
              onClick={handleOnboardingDismiss}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Entendido
            </button>
          </div>
        )}
        {!isInitialLoading && onboardingDone && <EnergyLevelSelector />}
      </>
    )
  }

  return (
    <>
      {syncBanner}
      <Loader isLoading={isInitialLoading} />
      {!isInitialLoading && <ActionScreen />}
    </>
  )
}

const AppWithWelcome = () => {
  const [showWelcome, setShowWelcome] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

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
        />
      )}
      {!showWelcome && (
        <div className="app-container">
          <div className="content">
            <div className="app-main" role="main">
              <AppContent />
            </div>
          </div>
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
