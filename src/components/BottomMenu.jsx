// Menú inferior flotante: ✔ Progreso, ≡ Lista, ⋯ Ajustes
import { playTapSound, initAudioContext } from '../utils/sounds'
import './BottomMenu.css'

const BottomMenu = ({
  activeTab,
  onTabChange,
  onMarkComplete,
  listPanelOpen,
  onListPanelToggle,
  onCloseListPanel,
  soundsEnabled,
  soundsVolume,
}) => {
  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
  }

  const handleWithSound = async (callback) => {
    try {
      await initAudioContext()
      await playTapSound(soundsEnabled, soundsVolume)
    } catch (e) {
      // Si falla el sonido, continuar con la acción de todas formas
    }
    callback()
  }

  const handleProgressClick = () => {
    vibrate()
    handleWithSound(() => {
      if (activeTab === 'progress' && onMarkComplete) {
        onMarkComplete()
      } else {
        onCloseListPanel?.()
        onTabChange('progress')
      }
    })
  }

  const handleListClick = () => {
    vibrate()
    handleWithSound(() => {
      onListPanelToggle?.()
    })
  }

  const handleTodayClick = () => {
    vibrate()
    handleWithSound(() => {
      onCloseListPanel?.()
      onTabChange('today')
    })
  }

  const handleSettingsClick = () => {
    vibrate()
    handleWithSound(() => {
      onCloseListPanel?.()
      onTabChange('settings')
    })
  }

  const handleRemindersClick = () => {
    vibrate()
    handleWithSound(() => {
      onCloseListPanel?.()
      onTabChange('reminders')
    })
  }

  return (
    <nav className="bottom-menu" role="navigation" aria-label="Menú principal">
      <button
        className={`bottom-menu__btn ${activeTab === 'progress' ? 'bottom-menu__btn--active' : ''}`}
        onClick={handleProgressClick}
        aria-label="Progreso: marcar acción completada"
        title="Progreso"
      >
        <svg className="bottom-menu__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 7l-10 10-5-5" />
        </svg>
      </button>
      <button
        className={`bottom-menu__btn ${listPanelOpen ? 'bottom-menu__btn--active' : ''}`}
        onClick={handleListClick}
        aria-label="Lista: elegir tarea"
        title="Lista"
      >
        <svg className="bottom-menu__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        className={`bottom-menu__btn ${activeTab === 'today' ? 'bottom-menu__btn--active' : ''}`}
        onClick={handleTodayClick}
        aria-label="Completadas hoy"
        title="Completadas hoy"
      >
        <svg className="bottom-menu__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <button
        className={`bottom-menu__btn ${activeTab === 'reminders' ? 'bottom-menu__btn--active' : ''}`}
        onClick={handleRemindersClick}
        aria-label="Recordatorios"
        title="Recordatorios"
      >
        <svg className="bottom-menu__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </button>
      <button
        className={`bottom-menu__btn ${activeTab === 'settings' ? 'bottom-menu__btn--active' : ''}`}
        onClick={handleSettingsClick}
        aria-label="Ajustes"
        title="Ajustes"
      >
        <svg className="bottom-menu__icon bottom-menu__icon--dots" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>
    </nav>
  )
}

export default BottomMenu
