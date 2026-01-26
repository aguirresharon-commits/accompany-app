import { useState, useCallback } from 'react'
import { AppProvider, useAppState } from './context/AppContext'
import EnergyLevelSelector from './components/EnergyLevelSelector'
import ActionScreen from './components/ActionScreen'
import Loader from './components/Loader'
import WelcomeScreen from './components/WelcomeScreen'

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
