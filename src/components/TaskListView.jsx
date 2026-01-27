// Lista corta de tareas disponibles - elegir y reducir
import { getActionsByLevel, getReducedAction } from '../data/actions'
import { getTodayDate } from '../utils/storage'
import { getTaskIcon } from '../data/iconMap'
import TaskIcon from './TaskIcon'
import './TaskListView.css'

const TaskListView = ({
  currentEnergyLevel,
  completedActions,
  allActions,
  onSelectTask,
}) => {
  if (!currentEnergyLevel) return null

  const today = getTodayDate()
  const completedIds = [
    ...completedActions.filter((ca) => ca.date === today).map((ca) => ca.actionId),
    ...(allActions || []).filter((a) => a.date === today && a.completed).map((a) => a.actionId),
  ]
  const uniqueCompletedIds = [...new Set(completedIds)]

  const actions = getActionsByLevel(currentEnergyLevel).filter(
    a => !uniqueCompletedIds.includes(a.id)
  )

  if (actions.length === 0) {
    return (
      <div className="task-list-view">
        <p className="task-list-view__empty">No hay más tareas disponibles hoy.</p>
      </div>
    )
  }

  const showReduce = (a) => {
    if (a.canReduce && a.reducedText) return true
    const reduced = getReducedAction(a)
    return reduced && reduced.id !== a.id
  }

  return (
    <div className="task-list-view">
      <ul className="task-list-view__list">
        {actions.slice(0, 12).map((action) => {
          const canReduce = showReduce(action)
          return (
            <li key={action.id} className="task-list-view__item">
              <button
                className="task-list-view__item-btn"
                onClick={() => onSelectTask(action)}
                type="button"
              >
                {action.id && getTaskIcon(action.id) && (
                  <TaskIcon iconName={getTaskIcon(action.id)} className="task-list-view__icon" size={20} />
                )}
                <span className="task-list-view__text">{action.text}</span>
              </button>
              {canReduce && (
                <button
                  className="task-list-view__reduce-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    const reduced = getReducedAction(action)
                    if (reduced && reduced.text !== action.text) {
                      onSelectTask(reduced)
                    }
                  }}
                  type="button"
                  aria-label="Hacerlo más chico"
                  title="Hacerlo más chico"
                >
                  <span aria-hidden="true">−</span>
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default TaskListView
