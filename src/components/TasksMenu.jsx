// Menú de filtros y controles para las tareas completadas
import { useState, useEffect } from 'react'
import { useAppState } from '../hooks/useAppState'
import './TasksMenu.css'

const TasksMenu = ({ sortOrder, onSortOrderChange }) => {
  const { resetAllActions, getTodayActions, completedActions } = useAppState()
  const [internalSortOrder, setInternalSortOrder] = useState('completed-first')
  const todayActions = getTodayActions()
  
  // Usar sortOrder externo si se proporciona, sino usar el interno
  const currentSortOrder = sortOrder !== undefined ? sortOrder : internalSortOrder

  // Manejar cambio de orden (alternar entre completadas primero y no completadas primero)
  const handleSortToggle = () => {
    const newOrder = currentSortOrder === 'completed-first' ? 'not-completed-first' : 'completed-first'
    setInternalSortOrder(newOrder)
    if (onSortOrderChange) {
      onSortOrderChange(newOrder)
    }
  }

  // Manejar resetear tareas
  const handleReset = () => {
    if (window.confirm('¿Reiniciar todas las tareas completadas?')) {
      resetAllActions()
    }
  }

  return (
    <div className="tasks-menu">
      <div className="tasks-menu__filters">
        <button
          className="tasks-menu__filter-btn tasks-menu__filter-btn--active"
          onClick={handleSortToggle}
          aria-label={currentSortOrder === 'completed-first' ? 'Completadas primero' : 'No completadas primero'}
          title={currentSortOrder === 'completed-first' ? 'Completadas primero (toca para cambiar)' : 'No completadas primero (toca para cambiar)'}
        >
          <svg className="tasks-menu__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {currentSortOrder === 'completed-first' ? (
              <>
                {/* Círculo completado arriba (más visible) */}
                <circle cx="8" cy="5" r="2.5"/>
                <path d="M6.5 5l1 1 2-2" strokeWidth="1.2"/>
                {/* Círculo no completado abajo (más tenue) */}
                <circle cx="8" cy="11" r="2.5" opacity="0.4"/>
              </>
            ) : (
              <>
                {/* Círculo no completado arriba (más visible) */}
                <circle cx="8" cy="5" r="2.5" opacity="0.4"/>
                {/* Círculo completado abajo (más visible) */}
                <circle cx="8" cy="11" r="2.5"/>
                <path d="M6.5 11l1 1 2-2" strokeWidth="1.2"/>
              </>
            )}
          </svg>
        </button>
      </div>

      {completedActions.length > 0 && (
        <button
          className="tasks-menu__reset-btn"
          onClick={handleReset}
          aria-label="Reiniciar todas las tareas completadas"
          title="Reiniciar"
        >
          <svg className="tasks-menu__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 8a7 7 0 0 1 7-7v2M15 8a7 7 0 0 1-7 7v-2M8 1L6 3M8 15l2-2"/>
            <path d="M8 1v6M8 15V9"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default TasksMenu
