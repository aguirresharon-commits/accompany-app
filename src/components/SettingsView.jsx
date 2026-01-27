// Ajustes: ritmo, reiniciar día, sonidos, ayuda
import { ENERGY_LEVELS, ENERGY_LEVEL_KEYS } from '../data/actions'
import { EnergyLevelIcon } from './TaskIcon'
import './SettingsView.css'

const SettingsView = ({
  currentEnergyLevel,
  onEnergyLevelChange,
  onRestartDay,
  soundsEnabled,
  onSoundsEnabledChange,
}) => {
  return (
    <div className="settings-view">
      <section className="settings-view__section">
        <h2 className="settings-view__title">Ritmo</h2>
        <p className="settings-view__desc">Nivel de exigencia de las acciones.</p>
        <div className="settings-view__levels">
          {ENERGY_LEVEL_KEYS.map((key) => {
            const level = ENERGY_LEVELS[key]
            const isActive = currentEnergyLevel === key
            return (
              <button
                key={key}
                className={`settings-view__level-btn ${isActive ? 'settings-view__level-btn--active' : ''}`}
                onClick={() => onEnergyLevelChange(key)}
                type="button"
              >
                <EnergyLevelIcon level={key} className="settings-view__level-icon" size={24} />
                <span className="settings-view__level-label">{level.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="settings-view__section">
        <h2 className="settings-view__title">Sonidos</h2>
        <p className="settings-view__desc">Feedback sutil al completar tareas y acciones.</p>
        <button
          className={`settings-view__toggle ${soundsEnabled ? 'settings-view__toggle--active' : ''}`}
          onClick={() => onSoundsEnabledChange(!soundsEnabled)}
          type="button"
        >
          {soundsEnabled ? 'Activados' : 'Desactivados'}
        </button>
      </section>

      <section className="settings-view__section">
        <h2 className="settings-view__title">Reiniciar día</h2>
        <p className="settings-view__desc">Marcar todas las tareas como no completadas.</p>
        <button
          className="settings-view__restart-btn"
          onClick={onRestartDay}
          type="button"
        >
          Reiniciar día
        </button>
      </section>

      <section className="settings-view__section settings-view__section--help">
        <h2 className="settings-view__title">Sobre Control</h2>
        <p className="settings-view__philosophy">
          Una acción a la vez. Sin presión, sin evasión. Elegí una acción mínima, hacela, y avanzá. 
          Si cuesta, reducila. El objetivo es mantener el control y la calma.
        </p>
      </section>
    </div>
  )
}

export default SettingsView
