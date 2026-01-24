import { AppProvider, useAppState } from './context/AppContext'
import EnergyLevelSelector from './components/EnergyLevelSelector'

// Componente interno que usa el contexto
const AppContent = () => {
  const { currentEnergyLevel } = useAppState()

  // Si no hay nivel seleccionado, mostrar selector
  if (!currentEnergyLevel) {
    return <EnergyLevelSelector />
  }

  // Si hay nivel seleccionado, mostrar pantalla de acción
  // (esto se implementará en la Tarea 5)
  return (
    <div className="app">
      <p>Pantalla de acción (Tarea 5)</p>
      <p>Nivel seleccionado: {currentEnergyLevel}</p>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
