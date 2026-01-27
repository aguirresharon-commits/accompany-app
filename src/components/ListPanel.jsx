// Panel slide-up: aviso del nivel de las tareas + lista filtrada por energía del usuario
import { useEffect } from 'react'
import { getEnergyLevelInfo } from '../data/actions'
import TaskListView from './TaskListView'
import './ListPanel.css'

const ListPanel = ({
  isOpen,
  onClose,
  currentEnergyLevel,
  completedActions,
  allActions,
  onSelectTask,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (action) => {
    onSelectTask(action)
    onClose()
  }

  const levelLabel = getEnergyLevelInfo(currentEnergyLevel)?.label || currentEnergyLevel

  return (
    <div className="list-panel" role="dialog" aria-label="Elegir tarea">
      <button
        type="button"
        className="list-panel__backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="list-panel__drawer">
        <div className="list-panel__handle" aria-hidden="true" />
        <p className="list-panel__title">Nivel {levelLabel}</p>
        <div className="list-panel__content">
          <TaskListView
            currentEnergyLevel={currentEnergyLevel}
            completedActions={completedActions}
            allActions={allActions}
            onSelectTask={handleSelect}
          />
        </div>
      </div>
    </div>
  )
}

export default ListPanel
