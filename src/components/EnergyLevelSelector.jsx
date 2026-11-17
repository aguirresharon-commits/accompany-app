import { useEffect, useRef, useState } from 'react'
import { ENERGY_LEVELS, ENERGY_LEVEL_KEYS } from '../data/actions'
import { initAudioContext } from '../utils/sounds'
import ControlSpark from './ControlSpark'
import StarryBackground from './StarryBackground'
import './EnergyLevelSelector.css'

export default function EnergyLevelSelector({ onSelect }) {
  const [selected, setSelected] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  function select(level) {
    if (timer.current !== null) return
    initAudioContext().catch(() => {})
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSelect(level)
      return
    }
    setSelected(level)
    timer.current = setTimeout(() => onSelect(level), 430)
  }

  return (
    <div className="energy-selector">
      <StarryBackground />
      <h1 className="energy-selector__title">¿Cómo te sentís hoy?</h1>
      <ControlSpark state={selected ?? 'idle'} className="energy-selector__spark" />
      <div className="energy-selector__levels">
        {ENERGY_LEVEL_KEYS.map(key => {
          const level = ENERGY_LEVELS[key]
          return (
            <button key={key} type="button" className="energy-selector__level-button"
              aria-label={`Seleccionar nivel: ${level.label}`} aria-description={level.description}
              aria-pressed={selected === key} onClick={() => select(key)}>
              <span>{level.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
