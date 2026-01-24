// Componente de selección de nivel de energía
// Pantalla inicial empática y minimalista
import { useAppState } from '../hooks/useAppState'
import { ENERGY_LEVELS, ENERGY_LEVEL_KEYS } from '../data/actions'
import './EnergyLevelSelector.css'

const EnergyLevelSelector = () => {
  const { setEnergyLevel } = useAppState()

  const handleSelectLevel = (levelKey) => {
    setEnergyLevel(levelKey)
  }

  return (
    <div className="energy-selector">
      <div className="energy-selector__header">
        <h1 className="energy-selector__title">¿Cómo te sentís hoy?</h1>
        <p className="energy-selector__subtitle">
          Elegí el nivel que mejor te represente. Está bien elegir cualquier opción.
        </p>
      </div>

      <div className="energy-selector__levels">
        {ENERGY_LEVEL_KEYS.map((levelKey) => {
          const level = ENERGY_LEVELS[levelKey]
          return (
            <button
              key={levelKey}
              className="energy-selector__level-button"
              onClick={() => handleSelectLevel(levelKey)}
              aria-label={`Seleccionar nivel: ${level.label}`}
            >
              <span className="energy-selector__emoji">{level.emoji}</span>
              <div className="energy-selector__level-info">
                <span className="energy-selector__level-label">{level.label}</span>
                <span className="energy-selector__level-description">{level.description}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default EnergyLevelSelector
