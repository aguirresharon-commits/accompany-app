// Pantalla principal: Control, Empezar (TimeSelect → Timer → TimerEnd), Completadas hoy, menú inferior
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppState } from '../hooks/useAppState'
import { useAuth } from '../context/AuthContext'
import { getRandomAction, getReducedAction, isInstantTask, getSectionLabel, getEnergyLevelInfo } from '../data/actions'
import { getTodayDate, formatTime } from '../utils/storage'
import { playStartSound, initAudioContext } from '../utils/sounds'
import { getTaskIcon } from '../data/iconMap'
import TaskIcon from './TaskIcon'
import Loader from './Loader'
import BottomMenu from './BottomMenu'
import ListPanel from './ListPanel'
import SettingsView from './SettingsView'
import CalendarView from './CalendarView'
import NotePrompt from './NotePrompt'
import TimeSelectModal from './TimeSelectModal'
import TimerView from './TimerView'
import TimerEndModal from './TimerEndModal'
import AddNoteModal from './AddNoteModal'
import PremiumView from './PremiumView'
import StarryBackground from './StarryBackground'
import './ActionScreen.css'

const COMPLETION_MESSAGES = ['Hecho.', 'Avanzaste.', 'Eso ya está.', 'Suficiente por hoy.']
const getRandomCompletionMessage = () =>
  COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]

const FEELING_OPTIONS = ['Bien', 'Regular', 'Me cuesta hoy']

const CONFIRM_MESSAGES = ['Eso es todo por hoy.', 'Listo.', 'Listo por ahora.']
const getRandomConfirmMessage = () =>
  CONFIRM_MESSAGES[Math.floor(Math.random() * CONFIRM_MESSAGES.length)]

const ActionScreen = () => {
  const { logout } = useAuth()
  const {
    currentEnergyLevel,
    setCurrentAction,
    completeAction,
    setEnergyLevel,
    scheduleEnergyForNextDay,
    resetAllActions,
    completedActions,
    allActions,
    addSessionNote,
    sounds,
    setSoundsEnabled,
    userPlan,
    setUserPlan,
  } = useAppState()

  const [displayedAction, setDisplayedAction] = useState(null)
  const [activeTab, setActiveTab] = useState('progress')
  const [listPanelOpen, setListPanelOpen] = useState(false)
  const [notePromptAction, setNotePromptAction] = useState(null)
  const [completionOverlay, setCompletionOverlay] = useState(null) // { message: string, showQuestion?: boolean } | null
  const [completionFeelingWriting, setCompletionFeelingWriting] = useState(false)
  const [completionFeelingText, setCompletionFeelingText] = useState('')
  const [completionConfirmMessage, setCompletionConfirmMessage] = useState(null) // "Eso es todo por hoy." etc. después de elegir cómo se sintió
  const [noteSavedOverlay, setNoteSavedOverlay] = useState(null)

  // Flujo Empezar: timeSelect → timer → timerEnd
  const [empezarFlow, setEmpezarFlow] = useState(null)
  const [empezarAction, setEmpezarAction] = useState(null)
  const [empezarSeconds, setEmpezarSeconds] = useState(600) // 10 minutos en segundos por defecto
  const [addNoteOpen, setAddNoteOpen] = useState(false)
  const [instantTaskResponse, setInstantTaskResponse] = useState(null) // 'yes' | 'not-yet' | null
  const [premiumViewOpen, setPremiumViewOpen] = useState(false)

  const selectNewAction = useCallback(() => {
    if (!currentEnergyLevel) return
    const today = getTodayDate()
    const completedIds = [
      ...completedActions.filter((ca) => ca.date === today).map((ca) => ca.actionId),
      ...(allActions || []).filter((a) => a.date === today && a.completed).map((a) => a.actionId),
    ]
    const uniqueCompletedIds = [...new Set(completedIds)]
    const action = getRandomAction(currentEnergyLevel, uniqueCompletedIds) || getRandomAction(currentEnergyLevel)
    if (action) {
      setDisplayedAction(action)
      setCurrentAction(action)
    }
  }, [currentEnergyLevel, completedActions, allActions, setCurrentAction])

  useEffect(() => {
    if (currentEnergyLevel && !displayedAction) {
      selectNewAction()
    }
  }, [currentEnergyLevel, displayedAction, selectNewAction])

  // Resetear respuesta de tarea instantánea cuando cambia la acción mostrada
  useEffect(() => {
    setInstantTaskResponse(null)
  }, [displayedAction?.id])

  const completedActionsToday = useMemo(() => {
    const today = getTodayDate()
    return [...completedActions]
      .filter((c) => c.date === today)
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
  }, [completedActions])

  // Auto-cierre solo para “no todavía” (sin pregunta). El completado se cierra cuando el usuario elige opción o escribe.
  useEffect(() => {
    if (!completionOverlay || !completionOverlay.message || completionOverlay.showQuestion !== false) return
    const t = setTimeout(() => {
      setCompletionOverlay(null)
      setInstantTaskResponse(null)
    }, 2000)
    return () => clearTimeout(t)
  }, [completionOverlay])

  // Al mostrar el overlay con “¿Cómo te sentís?” reseteamos modo escribir y texto
  useEffect(() => {
    if (completionOverlay?.message && completionOverlay.showQuestion !== false) {
      setCompletionFeelingWriting(false)
      setCompletionFeelingText('')
    }
  }, [completionOverlay?.message, completionOverlay?.showQuestion])

  const closeCompletionAndNext = useCallback(() => {
    setCompletionOverlay(null)
    setCompletionFeelingWriting(false)
    setCompletionFeelingText('')
    setCompletionConfirmMessage(null)
    selectNewAction()
  }, [selectNewAction])

  const showConfirmAndClose = useCallback(
    (feelingOption = null) => {
      if (feelingOption) scheduleEnergyForNextDay(feelingOption)
      setCompletionConfirmMessage(getRandomConfirmMessage())
      setTimeout(() => closeCompletionAndNext(), 1500)
    },
    [scheduleEnergyForNextDay, closeCompletionAndNext]
  )

  const handleEmpezar = async () => {
    if (!displayedAction) return
    const soundsConfig = sounds || { enabled: true, volume: 0.3 }
    await initAudioContext()
    await playStartSound(soundsConfig.enabled, soundsConfig.volume)
    setListPanelOpen(false)
    setEmpezarAction(displayedAction)
    setEmpezarFlow('timeSelect')
  }

  const handleTimeSelect = (seconds) => {
    setEmpezarSeconds(seconds)
    setEmpezarFlow('timer')
  }

  const handleTimeSelectClose = () => {
    setEmpezarFlow(null)
    setEmpezarAction(null)
  }

  const handleTimerEnd = () => {
    setEmpezarFlow('timerEnd')
  }

  const handleTimerStop = () => {
    setEmpezarFlow('timerEnd')
  }

  const handleTimerEndMarkComplete = () => {
    if (!empezarAction) return
    const actionToComplete = empezarAction
    setEmpezarFlow(null)
    setEmpezarAction(null)
    completeAction(actionToComplete)
    setCompletionOverlay({ message: getRandomCompletionMessage() })
  }

  const handleTimerEndContinue = () => {
    setEmpezarSeconds((s) => Math.min(s + 300, 1200)) // Agregar 5 minutos (300 segundos), máximo 20 min (1200 segundos)
    setEmpezarFlow('timer')
  }

  const handleTimerEndAddNote = () => {
    setAddNoteOpen(true)
  }

  const handleTimerEndClose = () => {
    setEmpezarFlow(null)
    setEmpezarAction(null)
  }

  const handleAddNoteConfirm = (note) => {
    if (empezarAction && note && String(note).trim()) {
      addSessionNote(empezarAction, note)
      setNoteSavedOverlay('Anotado.')
      setTimeout(() => setNoteSavedOverlay(null), 1000)
    }
    setAddNoteOpen(false)
  }

  const handleAddNoteSkip = () => {
    setAddNoteOpen(false)
  }

  const handleReduce = () => {
    if (!displayedAction) return
    const reduced = getReducedAction(displayedAction)
    if (reduced && reduced.text !== displayedAction.text) {
      setDisplayedAction(reduced)
      setCurrentAction(reduced)
    }
  }

  const handleMarkComplete = () => {
    if (!displayedAction) return
    setNotePromptAction(displayedAction)
  }

  const handleNoteConfirm = (note) => {
    if (!notePromptAction) return
    const actionToComplete = notePromptAction
    setNotePromptAction(null)
    setInstantTaskResponse(null)
    completeAction(actionToComplete, note)
    setCompletionOverlay({ message: getRandomCompletionMessage() })
  }

  const handleNoteSkip = () => {
    if (!notePromptAction) return
    const actionToComplete = notePromptAction
    setNotePromptAction(null)
    setInstantTaskResponse(null)
    completeAction(actionToComplete)
    setCompletionOverlay({ message: getRandomCompletionMessage() })
  }

  // Handlers para tareas instantáneas
  const handleInstantYes = () => {
    if (!displayedAction) return
    setInstantTaskResponse('yes')
    setNotePromptAction(displayedAction)
  }

  const handleInstantNotYet = () => {
    if (!displayedAction) return
    setInstantTaskResponse('not-yet')
    setCompletionOverlay({ message: 'Está bien, puede ser después.', showQuestion: false })
  }

  const handleSelectTask = (action) => {
    setDisplayedAction(action)
    setCurrentAction(action)
    setListPanelOpen(false)
    setActiveTab('progress')
    setInstantTaskResponse(null) // Reset instant task response when selecting new task
  }

  const handleListPanelToggle = () => {
    setListPanelOpen((v) => !v)
  }

  const handleRestartDay = () => {
    if (window.confirm('¿Reiniciar el día? Todas las tareas se marcarán como no completadas.')) {
      resetAllActions()
      selectNewAction()
      setListPanelOpen(false)
      setActiveTab('progress')
    }
  }

  if (!currentEnergyLevel) return null
  if (activeTab === 'progress' && !displayedAction) return <Loader isLoading={true} />

  const soundsConfig = sounds || { enabled: true, volume: 0.3 }
  const isInstant = displayedAction ? isInstantTask(displayedAction) : false

  return (
    <div className="action-screen">
      <StarryBackground />
      <header className="action-screen__header">
        <h1 className="action-screen__brand">CONTROL</h1>
      </header>

      <main className="action-screen__main">
        {premiumViewOpen ? (
          <PremiumView
            userPlan={userPlan || 'free'}
            onActivate={() => {
              setUserPlan('premium')
              setPremiumViewOpen(false)
            }}
            onClose={() => setPremiumViewOpen(false)}
          />
        ) : (
          <>
        {activeTab === 'progress' && (
          <div className="action-screen__progress">
            <div className="action-screen__card">
              <div className="action-screen__task">
                {(displayedAction?.section || displayedAction?.level) && (
                  <p className="action-screen__task-meta" aria-label="Sección y nivel">
                    {[getSectionLabel(displayedAction.section), getEnergyLevelInfo(displayedAction.level)?.label].filter(Boolean).join(' · ')}
                  </p>
                )}
                {displayedAction?.id && getTaskIcon(displayedAction.id) && (
                  <TaskIcon iconName={getTaskIcon(displayedAction.id)} className="action-screen__icon" size={32} />
                )}
                <p className="action-screen__action-text">{displayedAction?.text}</p>
              </div>
              {isInstant ? (
                // UI para tareas instantáneas: pregunta y dos opciones
                <div className="action-screen__instant">
                  <p className="action-screen__instant-question">¿Pudiste hacerlo?</p>
                  <div className="action-screen__buttons">
                    <button
                      className="action-screen__button action-screen__button--secondary"
                      onClick={handleInstantNotYet}
                      aria-label="No todavía"
                    >
                      No todavía
                    </button>
                    <button
                      className="action-screen__button action-screen__button--primary"
                      onClick={handleInstantYes}
                      aria-label="Sí"
                    >
                      Sí
                    </button>
                  </div>
                </div>
              ) : (
                // UI normal para tareas con cronograma
                <div className="action-screen__buttons">
                  <button
                    className="action-screen__button action-screen__button--secondary"
                    onClick={handleReduce}
                    aria-label="Hacerlo más chico"
                  >
                    Hacerlo más chico
                  </button>
                  <button
                    className="action-screen__button action-screen__button--primary"
                    onClick={handleEmpezar}
                    aria-label="Empezar"
                  >
                    Empezar
                  </button>
                </div>
              )}
            </div>
            {completedActionsToday.length > 0 && (
              <section className="action-screen__today" aria-label="Completadas hoy">
                <h2 className="action-screen__today-title">Completadas hoy</h2>
                <ul className="action-screen__today-list">
                  {completedActionsToday.map((c) => (
                    <li key={`${c.actionId}-${c.completedAt}`} className="action-screen__today-item">
                      <span className="action-screen__today-check" aria-hidden="true">✓</span>
                      {c.actionId && getTaskIcon(c.actionId) && (
                        <TaskIcon iconName={getTaskIcon(c.actionId)} className="action-screen__today-icon" size={20} />
                      )}
                      <div className="action-screen__today-content">
                        {(c.actionId || c.level) && (
                          <span className="action-screen__today-meta">
                            {[getSectionLabel((c.actionId || '').split('-')[0]), getEnergyLevelInfo(c.level)?.label].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        <span className="action-screen__today-text">{c.actionText}</span>
                        <span className="action-screen__today-time">{formatTime(c.completedAt)}</span>
                        {c.note && (
                          <p className="action-screen__today-note">{c.note}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {activeTab === 'today' && (
          <CalendarView onRequestPremium={() => setPremiumViewOpen(true)} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            currentEnergyLevel={currentEnergyLevel}
            onEnergyLevelChange={setEnergyLevel}
            onRestartDay={handleRestartDay}
            soundsEnabled={soundsConfig.enabled}
            onSoundsEnabledChange={setSoundsEnabled}
            userPlan={userPlan || 'free'}
            onUpgrade={() => setPremiumViewOpen(true)}
            onLogout={logout}
          />
        )}
          </>
        )}
      </main>

      <ListPanel
        isOpen={listPanelOpen}
        onClose={() => setListPanelOpen(false)}
        currentEnergyLevel={currentEnergyLevel}
        completedActions={completedActions}
        allActions={allActions}
        onSelectTask={handleSelectTask}
      />

      {empezarFlow === 'timeSelect' && (
        <TimeSelectModal
          action={empezarAction}
          onSelect={handleTimeSelect}
          onClose={handleTimeSelectClose}
          isPremium={userPlan === 'premium'}
          onRequestPremium={() => {
            handleTimeSelectClose()
            setPremiumViewOpen(true)
          }}
        />
      )}

      {empezarFlow === 'timer' && (
        <TimerView
          action={empezarAction}
          seconds={empezarSeconds}
          onEnd={handleTimerEnd}
          onStop={handleTimerStop}
          soundsEnabled={soundsConfig.enabled}
          soundsVolume={soundsConfig.volume}
        />
      )}

      {empezarFlow === 'timerEnd' && (
        <TimerEndModal
          action={empezarAction}
          onMarkComplete={handleTimerEndMarkComplete}
          onContinueMore={handleTimerEndContinue}
          onAddNote={handleTimerEndAddNote}
          onClose={handleTimerEndClose}
          isPremium={userPlan === 'premium'}
          onRequestPremium={() => {
            handleTimerEndClose()
            setPremiumViewOpen(true)
          }}
        />
      )}

      {addNoteOpen && (
        <AddNoteModal
          action={empezarAction}
          onConfirm={handleAddNoteConfirm}
          onSkip={handleAddNoteSkip}
        />
      )}

      {completionOverlay?.message && (
        <div
          className="action-screen__overlay action-screen__overlay--completion"
          role="dialog"
          aria-labelledby={completionConfirmMessage ? undefined : 'completion-feeling-title'}
          aria-live="polite"
        >
          <div className="action-screen__completion-inner">
            {completionConfirmMessage ? (
              <p className="action-screen__overlay-text action-screen__overlay-text--completion">
                {completionConfirmMessage}
              </p>
            ) : (
              <>
                <p className="action-screen__overlay-text action-screen__overlay-text--completion">
                  {completionOverlay.message}
                </p>
                {completionOverlay.showQuestion !== false && (
                  <>
                    <p id="completion-feeling-title" className="action-screen__completion-feeling-label">
                      ¿Cómo te sentís?
                    </p>
                    {!completionFeelingWriting ? (
                      <div className="action-screen__completion-feelings">
                        {FEELING_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className="action-screen__completion-feeling-btn"
                            onClick={() => showConfirmAndClose(opt)}
                            aria-label={`Me siento ${opt}`}
                          >
                            {opt}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="action-screen__completion-question"
                          onClick={() => setCompletionFeelingWriting(true)}
                          aria-label="Escribir cómo me siento"
                        >
                          Escribir cómo me siento
                        </button>
                      </div>
                    ) : (
                      <div className="action-screen__completion-write">
                        <textarea
                          className="action-screen__completion-textarea"
                          value={completionFeelingText}
                          onChange={(e) => setCompletionFeelingText(e.target.value)}
                          placeholder="Ej: tranquilo, con energía, agotado..."
                          rows={3}
                          aria-label="Escribir cómo te sentís"
                          autoFocus
                        />
                        <button
                          type="button"
                          className="action-screen__completion-done-btn"
                          onClick={() => showConfirmAndClose()}
                          aria-label="Listo"
                        >
                          Listo
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {noteSavedOverlay && (
        <div className="action-screen__overlay action-screen__overlay--note-saved" role="status" aria-live="polite">
          <p className="action-screen__overlay-text">{noteSavedOverlay}</p>
        </div>
      )}

      {notePromptAction && (
        <NotePrompt
          action={notePromptAction}
          onConfirm={handleNoteConfirm}
          onSkip={handleNoteSkip}
        />
      )}

      {!empezarFlow && !premiumViewOpen && (
        <BottomMenu
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMarkComplete={activeTab === 'progress' ? handleMarkComplete : undefined}
          listPanelOpen={listPanelOpen}
          onListPanelToggle={handleListPanelToggle}
          onCloseListPanel={() => setListPanelOpen(false)}
          soundsEnabled={soundsConfig.enabled}
          soundsVolume={soundsConfig.volume}
        />
      )}
    </div>
  )
}

export default ActionScreen
