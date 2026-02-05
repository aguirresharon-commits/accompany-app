// Pantalla principal: Control, Empezar (TimeSelect → Timer → TimerEnd), Completadas hoy, menú inferior
import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense, Component } from 'react'
import { useAppState } from '../hooks/useAppState'
import { getRandomAction, getReducedAction, isInstantTask, getSectionLabel, getEnergyLevelInfo } from '../data/actions'
import { getTodayDate, formatTime } from '../utils/storage'
import { getDisplayName, setDisplayName } from '../utils/displayName'
import { playStartSound, initAudioContext } from '../utils/sounds'
import { getTaskIcon } from '../data/iconMap'
import TaskIcon from './TaskIcon'
import Loader from './Loader'
import BottomMenu from './BottomMenu'
import ListPanel from './ListPanel'
import SettingsView from './SettingsView'
import CalendarView from './CalendarView'
import RemindersView from './RemindersView'
import NotePrompt from './NotePrompt'
import TimeSelectModal from './TimeSelectModal'
import TimerView from './TimerView'
import TimerEndModal from './TimerEndModal'
import AddNoteModal from './AddNoteModal'
import AddReminderModal from './AddReminderModal'
import PremiumView from './PremiumView'
import StarryBackground from './StarryBackground'
import BackButton from './BackButton'
import { apiFetch } from '../api/client'
import { getCurrentUser } from '../services/authService'
import { updateReminder } from '../services/remindersService'
import { useRemindersScheduler } from '../hooks/useRemindersScheduler'
import './ActionScreen.css'

const LoginScreen = lazy(() => import('./LoginScreen'))
const ForgotPasswordScreen = lazy(() => import('./ForgotPasswordScreen'))
const ResetPasswordScreen = lazy(() => import('./ResetPasswordScreen'))

class LoginErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError () {
    return { hasError: true }
  }
  render () {
    if (this.state.hasError) {
      return <Loader isLoading={true} />
    }
    return this.props.children
  }
}

const COMPLETION_MESSAGES = ['Hecho.', 'Avanzaste.', 'Eso ya está.', 'Suficiente por hoy.']
const getRandomCompletionMessage = () =>
  COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]

const FEELING_OPTIONS = ['Bien', 'Regular', 'Me cuesta hoy']

const CONFIRM_MESSAGES = ['Eso es todo por hoy.', 'Listo.', 'Listo por ahora.']
const getRandomConfirmMessage = () =>
  CONFIRM_MESSAGES[Math.floor(Math.random() * CONFIRM_MESSAGES.length)]

const ActionScreen = () => {
  const {
    currentEnergyLevel,
    setCurrentAction,
    completeAction,
    setEnergyLevel,
    scheduleEnergyForNextDay,
    resetAllActions,
    markListPickUsed,
    completedActions,
    allActions,
    listPickUsedDate,
    addSessionNote,
    sounds,
    setSoundsEnabled,
    userPlan,
    setUserPlan,
  } = useAppState()

  const [displayedAction, setDisplayedAction] = useState(null)
  const [activeTab, setActiveTab] = useState('progress')
  const [previousTab, setPreviousTab] = useState('settings')
  const [listPanelOpen, setListPanelOpen] = useState(false)
  const [notePromptAction, setNotePromptAction] = useState(null)
  const [completionOverlay, setCompletionOverlay] = useState(null) // { message: string, showQuestion?: boolean } | null
  const [completionFeelingWriting, setCompletionFeelingWriting] = useState(false)
  const [completionFeelingText, setCompletionFeelingText] = useState('')
  const [completionConfirmMessage, setCompletionConfirmMessage] = useState(null) // "Eso es todo por hoy." etc. después de elegir cómo se sintió
  const [noteSavedOverlay, setNoteSavedOverlay] = useState(null)
  const [reminderOverlay, setReminderOverlay] = useState(null) // { text, id, date, time, status?: 'pending'|'pospuesto'|'hecho' } | null
  const [reminderPostponeOpen, setReminderPostponeOpen] = useState(false)
  const [listBlockedToast, setListBlockedToast] = useState(false)
  const [postponedFeedbackToast, setPostponedFeedbackToast] = useState(null) // "✓ Tarea pospuesta para DD/MM · HH:mm" | null

  // Flujo Empezar: timeSelect → timer → timerEnd
  const [empezarFlow, setEmpezarFlow] = useState(null)
  const [empezarAction, setEmpezarAction] = useState(null)
  const [empezarSeconds, setEmpezarSeconds] = useState(600) // 10 minutos en segundos por defecto
  const [addNoteOpen, setAddNoteOpen] = useState(false)
  const [instantTaskResponse, setInstantTaskResponse] = useState(null) // 'yes' | 'not-yet' | null
  const [premiumViewOpen, setPremiumViewOpen] = useState(false)
  const [loginForPremium, setLoginForPremium] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [namePromptUid, setNamePromptUid] = useState(null)
  const [namePromptValue, setNamePromptValue] = useState('')
  const [premiumPending, setPremiumPending] = useState(false)
  const [premiumPendingLoading, setPremiumPendingLoading] = useState(false)
  const [loginSubView, setLoginSubView] = useState('login') // 'login' | 'forgot' | 'reset'
  const [showContinueDecision, setShowContinueDecision] = useState(false) // Pantalla "¿Continuar con otra?" tras completar
  const [taskClearedByUser, setTaskClearedByUser] = useState(false) // "Continuar con otra" → pantalla "Elegí una tarea del menú inferior"
  const [displayedActionCompleted, setDisplayedActionCompleted] = useState(false) // "Volver al inicio" → mostrar la tarea recién completada en la card
  const lastCompletedActionRef = useRef(null) // Tarea recién completada, para mostrar en inicio
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false)
  const [setPasswordNew, setSetPasswordNew] = useState('')
  const [setPasswordConfirm, setSetPasswordConfirm] = useState('')
  const [setPasswordLoading, setSetPasswordLoading] = useState(false)
  const [setPasswordError, setSetPasswordError] = useState('')
  const [setPasswordSuccess, setSetPasswordSuccess] = useState(false)

  // Si la app se abre con ?token= (link del email), ir a login y mostrar pantalla restablecer
  useEffect(() => {
    try {
      const token = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('token')
      if (token) {
        setActiveTab('login')
        setLoginSubView('reset')
      }
    } catch (_) {}
  }, [])

  // 401: sesión expirada → redirigir a login de forma controlada (el contexto ya muestra "Sesión expirada")
  useEffect(() => {
    const onSessionExpired = () => {
      setPreviousTab(activeTab)
      setActiveTab('login')
    }
    window.addEventListener('session-expired', onSessionExpired)
    return () => window.removeEventListener('session-expired', onSessionExpired)
  }, [activeTab])

  // Tras volver de Google con intención de crear contraseña, mostrar modal
  useEffect(() => {
    if (!currentUser?.uid) return
    try {
      if (window.localStorage?.getItem('control-want-set-password') === '1') {
        setShowSetPasswordModal(true)
      }
    } catch (_) {}
  }, [currentUser?.uid])

  const handleSetPasswordSubmit = useCallback(async (e) => {
    e.preventDefault()
    setSetPasswordError('')
    const p = (setPasswordNew || '').trim()
    const c = (setPasswordConfirm || '').trim()
    if (!p) {
      setSetPasswordError('Ingresá una contraseña.')
      return
    }
    if (p.length < 8 || !/[a-zA-Z]/.test(p) || !/\d/.test(p)) {
      setSetPasswordError('Al menos 8 caracteres, una letra y un número.')
      return
    }
    if (p !== c) {
      setSetPasswordError('Las contraseñas no coinciden.')
      return
    }
    setSetPasswordLoading(true)
    try {
      const { ok, data } = await apiFetch('/api/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: p })
      })
      if (!ok) {
        setSetPasswordError(data?.error || 'No se pudo crear la contraseña.')
        return
      }
      setSetPasswordSuccess(true)
      try {
        window.localStorage?.removeItem('control-want-set-password')
      } catch (_) {}
      setTimeout(() => {
        setShowSetPasswordModal(false)
        setSetPasswordSuccess(false)
        setSetPasswordNew('')
        setSetPasswordConfirm('')
      }, 2000)
    } catch (err) {
      setSetPasswordError(err?.message || 'Error de conexión.')
    } finally {
      setSetPasswordLoading(false)
    }
  }, [setPasswordNew, setPasswordConfirm])

  // Al abrir la pestaña de login: si hay token en URL → restablecer; si no → inicio de sesión
  useEffect(() => {
    if (activeTab === 'login') {
      try {
        const token = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('token')
        setLoginSubView(token ? 'reset' : 'login')
      } catch (_) {
        setLoginSubView('login')
      }
    }
  }, [activeTab])

  // Scheduler de recordatorios (notificaciones locales mientras la app está abierta)
  useRemindersScheduler()

  // Escuchar eventos de recordatorios y mostrar overlay en pantalla (siempre funciona)
  useEffect(() => {
    const handleReminderDue = (e) => {
      const { reminder } = e.detail
      if (!reminder || !reminder.text) return
      setReminderOverlay({
        text: reminder.text,
        id: reminder.id,
        date: reminder.date,
        time: reminder.time,
        status: 'pending',
      })
    }

    window.addEventListener('reminder-due', handleReminderDue)
    return () => window.removeEventListener('reminder-due', handleReminderDue)
  }, [])

  // Si una notificación pidió abrir Recordatorios, respetarlo sin rutas nuevas.
  useEffect(() => {
    const OPEN_TAB_KEY = 'control-open-tab'
    const applyOpenTab = () => {
      try {
        const requested = window.localStorage?.getItem(OPEN_TAB_KEY)
        if (requested === 'reminders') {
          setPreviousTab(activeTab)
          setActiveTab('reminders')
          window.localStorage?.removeItem(OPEN_TAB_KEY)
        }
      } catch {
        // ignore
      }
    }
    applyOpenTab()
    const onStorage = (e) => {
      if (e.key === OPEN_TAB_KEY) applyOpenTab()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', applyOpenTab)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', applyOpenTab)
    }
  }, [activeTab])

  useEffect(() => {
    let unsubscribe = () => {}
    let cancelled = false
    import('../services/authService')
      .then(({ getCurrentUser, onAuthChange }) => {
        if (cancelled) return
        setCurrentUser(getCurrentUser())
        unsubscribe = onAuthChange((u) => {
          if (!cancelled) setCurrentUser(u)
          // Al cerrar sesión o 401: limpiar estado de pantalla para no dejar nada "vivo"
          if (!cancelled && !u?.uid) {
            setDisplayedAction(null)
            setReminderOverlay(null)
            setReminderPostponeOpen(false)
            setTaskClearedByUser(false)
            setDisplayedActionCompleted(false)
            setCompletionOverlay(null)
            setShowContinueDecision(false)
            setNotePromptAction(null)
            setEmpezarFlow(null)
            setEmpezarAction(null)
            setPostponedFeedbackToast(null)
          }
        })
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null)
      })
    return () => {
      cancelled = true
      try {
        unsubscribe?.()
      } catch {
        // ignore
      }
    }
  }, [])

  const isPremiumUser = userPlan === 'premium'

  const handleActivatePremium = useCallback(() => {
    // Modo demo: no activar pago real. Premium se muestra como "Próximamente" en PremiumView.
    import('../services/authService')
      .then(({ getCurrentUser }) => {
        const user = getCurrentUser()
        if (!user) {
          setPremiumViewOpen(false)
          setLoginForPremium(true)
          return
        }
        // No abrir flujo de pago simulado; el usuario ve "Próximamente" en PremiumView
      })
      .catch(() => {
        setPremiumViewOpen(false)
        setLoginForPremium(true)
      })
  }, [])

  const selectNewAction = useCallback(() => {
    if (!currentEnergyLevel) return
    setDisplayedActionCompleted(false)
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

  // Mostrar una tarea en pantalla principal al cargar y cuando no hay tarea (salvo si el usuario eligió "Volver al inicio")
  useEffect(() => {
    if (currentEnergyLevel && !displayedAction && !taskClearedByUser) {
      selectNewAction()
    }
  }, [currentEnergyLevel, displayedAction, taskClearedByUser, selectNewAction])

  // Al cambiar el nivel de energía (p. ej. en Ajustes), actualizar la tarea sugerida al nuevo nivel
  const prevEnergyLevelRef = useRef(currentEnergyLevel)
  useEffect(() => {
    if (currentEnergyLevel == null) return
    if (prevEnergyLevelRef.current !== currentEnergyLevel) {
      prevEnergyLevelRef.current = currentEnergyLevel
      selectNewAction()
    } else {
      prevEnergyLevelRef.current = currentEnergyLevel
    }
  }, [currentEnergyLevel, selectNewAction])

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

  const closeCompletionAndShowDecision = useCallback(() => {
    setCompletionConfirmMessage(null)
    setShowContinueDecision(true)
  }, [])

  // "Continuar con otra" → pantalla "Elegí una tarea del menú inferior" (el usuario elige desde la barra)
  const closeCompletionAndNext = useCallback(() => {
    setCompletionOverlay(null)
    setCompletionFeelingWriting(false)
    setCompletionFeelingText('')
    setCompletionConfirmMessage(null)
    setShowContinueDecision(false)
    setDisplayedAction(null)
    setCurrentAction(null)
    setTaskClearedByUser(true)
    setDisplayedActionCompleted(false)
  }, [])

  // "Volver al inicio" → pantalla de inicio mostrando la tarea que acaba de completar
  const closeCompletionAndStay = useCallback(() => {
    setCompletionOverlay(null)
    setCompletionFeelingWriting(false)
    setCompletionFeelingText('')
    setCompletionConfirmMessage(null)
    setShowContinueDecision(false)
    const lastAction = lastCompletedActionRef.current
    if (lastAction) {
      setDisplayedAction(lastAction)
      setDisplayedActionCompleted(true)
      setCurrentAction(lastAction)
    } else {
      setDisplayedAction(null)
      setDisplayedActionCompleted(false)
    }
    setTaskClearedByUser(false)
  }, [setCurrentAction])

  const showConfirmAndClose = useCallback(
    (feelingOption = null) => {
      if (feelingOption) scheduleEnergyForNextDay(feelingOption)
      setCompletionConfirmMessage('Gracias por contarlo. Seguimos de a poco.')
      setTimeout(() => closeCompletionAndShowDecision(), 1800)
    },
    [scheduleEnergyForNextDay, closeCompletionAndShowDecision]
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
    lastCompletedActionRef.current = actionToComplete
    setEmpezarFlow(null)
    setEmpezarAction(null)
    setDisplayedAction(null)
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
    lastCompletedActionRef.current = actionToComplete
    setNotePromptAction(null)
    setInstantTaskResponse(null)
    setDisplayedAction(null)
    completeAction(actionToComplete, note)
    setCompletionOverlay({ message: getRandomCompletionMessage() })
  }

  const handleNoteSkip = () => {
    if (!notePromptAction) return
    const actionToComplete = notePromptAction
    lastCompletedActionRef.current = actionToComplete
    setNotePromptAction(null)
    setInstantTaskResponse(null)
    setDisplayedAction(null)
    completeAction(actionToComplete)
    setCompletionOverlay({ message: getRandomCompletionMessage() })
  }

  // Handlers para tareas instantáneas: solo mostrar "¿Cómo te sentís?", sin nota
  const handleInstantYes = () => {
    if (!displayedAction) return
    lastCompletedActionRef.current = displayedAction
    setInstantTaskResponse('yes')
    setDisplayedAction(null)
    completeAction(displayedAction)
    setCompletionOverlay({ message: getRandomCompletionMessage() })
  }

  const handleInstantNotYet = () => {
    if (!displayedAction) return
    setInstantTaskResponse('not-yet')
    setCompletionOverlay({ message: 'Está bien, puede ser después.', showQuestion: false })
  }

  const handleSelectTask = (action) => {
    setTaskClearedByUser(false)
    setDisplayedActionCompleted(false)
    setDisplayedAction(action)
    setCurrentAction(action)
    setListPanelOpen(false)
    setActiveTab('progress')
    setInstantTaskResponse(null)
    if (!isPremiumUser) markListPickUsed()
  }

  const handleListPanelToggle = () => {
    if (!listPanelOpen) {
      if (!isPremiumUser && listPickUsedDate === getTodayDate()) {
        setListBlockedToast(true)
        setTimeout(() => setListBlockedToast(false), 7000)
        return
      }
    }
    setListPanelOpen((v) => !v)
  }

  const handleRestartDay = () => {
    setTaskClearedByUser(false)
    setDisplayedActionCompleted(false)
    resetAllActions()
    selectNewAction()
    setListPanelOpen(false)
    setActiveTab('progress')
  }

  if (!currentEnergyLevel) return null

  const soundsConfig = sounds || { enabled: true, volume: 0.3 }
  const isInstant = displayedAction ? isInstantTask(displayedAction) : false

  return (
    <div className="action-screen">
      <StarryBackground />
      <header className="action-screen__header">
        <h1 className="action-screen__brand">CONTROL</h1>
      </header>

      <main className="action-screen__main">
        {loginForPremium ? (
          <Suspense fallback={<Loader isLoading={true} />}>
            <LoginScreen
              title="Iniciá sesión para activar Premium"
              note="Crear una cuenta no activa ningún pago."
              createAccountHint
              onSuccess={(user) => {
                setLoginForPremium(false)
                if (user?.uid) setPremiumViewOpen(true)
              }}
              onBack={() => setLoginForPremium(false)}
            />
          </Suspense>
        ) : premiumViewOpen ? (
          <PremiumView
            isPremium={isPremiumUser}
            userPlan={userPlan || 'free'}
            onActivate={handleActivatePremium}
            onClose={() => setPremiumViewOpen(false)}
          />
        ) : activeTab === 'login' ? (
          <LoginErrorBoundary>
            <Suspense fallback={<Loader isLoading={true} />}>
              {loginSubView === 'forgot' ? (
                <ForgotPasswordScreen
                  onBack={() => setLoginSubView('login')}
                  onNavigateToReset={() => setLoginSubView('reset')}
                />
              ) : loginSubView === 'reset' ? (
                <ResetPasswordScreen onBack={() => setLoginSubView('login')} />
              ) : (
                <LoginScreen
                  onSuccess={() => { setLoginSubView('login'); setActiveTab(previousTab) }}
                  onBack={() => { setLoginSubView('login'); setActiveTab(previousTab) }}
                  onNavigateToForgotPassword={() => setLoginSubView('forgot')}
                  createAccountHint
                />
              )}
            </Suspense>
          </LoginErrorBoundary>
        ) : activeTab === 'progress' ? (
          displayedAction ? (
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
              {displayedActionCompleted ? (
                <p className="action-screen__completed-badge" aria-live="polite">✓ Completada</p>
              ) : isInstant ? (
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
          ) : taskClearedByUser ? (
            <div className="action-screen__progress action-screen__progress--empty">
              <p className="action-screen__empty-label">Elegí una tarea del menú inferior</p>
            </div>
          ) : (
            <Loader isLoading={true} />
          )
        ) : activeTab === 'today' ? (
          <CalendarView
            isPremium={isPremiumUser}
            onRequestPremium={() => setPremiumViewOpen(true)}
          />
        ) : activeTab === 'reminders' ? (
          <>
            {postponedFeedbackToast && (
              <div className="action-screen__toast action-screen__toast--postponed" role="status" aria-live="polite">
                {postponedFeedbackToast}
              </div>
            )}
            <RemindersView
              isPremium={isPremiumUser}
              onRequestPremium={() => setPremiumViewOpen(true)}
            />
          </>
        ) : activeTab === 'settings' ? (
          <SettingsView
            currentEnergyLevel={currentEnergyLevel}
            onEnergyLevelChange={setEnergyLevel}
            onRestartDay={handleRestartDay}
            soundsEnabled={soundsConfig.enabled}
            onSoundsEnabledChange={setSoundsEnabled}
            isPremium={isPremiumUser}
            userPlan={userPlan || 'free'}
            onUpgrade={() => setPremiumViewOpen(true)}
            onOpenLogin={() => {
              setPreviousTab(activeTab)
              setActiveTab('login')
            }}
          />
        ) : (
          <Loader isLoading={true} />
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
          isPremium={isPremiumUser}
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
          isPremium={isPremiumUser}
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

      {(completionOverlay?.message || showContinueDecision) && (
        <div
          className="action-screen__overlay action-screen__overlay--completion"
          role="dialog"
          aria-labelledby={showContinueDecision ? 'completion-decision-title' : (completionConfirmMessage ? undefined : 'completion-feeling-title')}
          aria-live="polite"
        >
          {!showContinueDecision && <BackButton onClick={closeCompletionAndStay} />}
          <div className="action-screen__completion-inner">
            {showContinueDecision ? (
              <>
                <p id="completion-decision-title" className="action-screen__completion-decision-label">
                  ¿Querés continuar con las demás?
                </p>
                <div className="action-screen__completion-decision-btns">
                  <button
                    type="button"
                    className="action-screen__completion-feeling-btn"
                    onClick={closeCompletionAndStay}
                    aria-label="Volver al inicio"
                  >
                    Volver al inicio
                  </button>
                  <button
                    type="button"
                    className="action-screen__completion-feeling-btn action-screen__completion-feeling-btn--secondary"
                    onClick={closeCompletionAndNext}
                    aria-label="Continuar con otra tarea"
                  >
                    Continuar con otra
                  </button>
                </div>
              </>
            ) : completionConfirmMessage ? (
              <p className="action-screen__overlay-text action-screen__overlay-text--completion">
                {completionConfirmMessage}
              </p>
            ) : (
              <>
                <p className="action-screen__overlay-text action-screen__overlay-text--completion">
                  {completionOverlay?.message}
                </p>
                {completionOverlay?.showQuestion !== false && (
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
          <BackButton onClick={() => setNoteSavedOverlay(null)} />
          <div className="action-screen__note-saved-inner">
            <p className="action-screen__overlay-text">{noteSavedOverlay}</p>
          </div>
        </div>
      )}

      {listBlockedToast && (
        <div className="action-screen__overlay action-screen__overlay--list-blocked" role="status" aria-live="polite">
          <BackButton onClick={() => setListBlockedToast(false)} />
          <div className="action-screen__list-blocked-inner">
            <p className="action-screen__overlay-text action-screen__overlay-text--list-blocked">
              Solo podés elegir una tarea desde la lista por día. Activá Premium para elegir libremente.
            </p>
            <button
              type="button"
              className="action-screen__list-blocked-btn"
              onClick={() => {
                setListBlockedToast(false)
                setPremiumViewOpen(true)
              }}
            >
              Ser Premium
            </button>
          </div>
        </div>
      )}

      {reminderOverlay && (reminderOverlay.status || 'pending') === 'pending' && (
        <div
          className="action-screen__overlay action-screen__overlay--reminder"
          role="dialog"
          aria-label="Recordatorio"
        >
          <BackButton onClick={() => {
            setReminderOverlay(null)
            setCurrentAction(null)
            setDisplayedAction(null)
          }} />
          <div className="action-screen__reminder-inner">
            <p className="action-screen__reminder-text">{reminderOverlay.text}</p>
            <p className="action-screen__reminder-motivational">Es momento de hacerlo</p>
            <div className="action-screen__reminder-actions">
              <button
                type="button"
                className="action-screen__reminder-btn action-screen__reminder-btn--secondary"
                onClick={() => setReminderPostponeOpen(true)}
              >
                Posponer
              </button>
              <button
                type="button"
                className="action-screen__reminder-btn action-screen__reminder-btn--primary"
                onClick={async () => {
                  const rid = reminderOverlay.id
                  const user = getCurrentUser()
                  if (user?.uid) {
                    const { ok } = await apiFetch(`/api/reminders/${rid}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'hecho' }),
                    })
                    if (ok) window.dispatchEvent(new CustomEvent('reminders-updated'))
                  } else {
                    updateReminder(rid, { status: 'hecho' })
                    window.dispatchEvent(new CustomEvent('reminders-updated'))
                  }
                  setReminderOverlay(null)
                  setCurrentAction(null)
                  setDisplayedAction(null)
                  setActiveTab('reminders')
                }}
              >
                Hecho
              </button>
            </div>
          </div>
        </div>
      )}

      {reminderPostponeOpen && reminderOverlay && (
        <AddReminderModal
          onTop
          initial={{
            id: reminderOverlay.id,
            date: reminderOverlay.date,
            time: reminderOverlay.time,
            alarmEnabled: true,
          }}
          postponeOnly
          onClose={() => setReminderPostponeOpen(false)}
          onCreate={async (data) => {
            const user = getCurrentUser()
            const [y, m, d] = String(data.date).split('-').map(Number)
            const [hh, mm] = String(data.time || '09:00').split(':').map(Number)
            const postponedUntil = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString()
            if (user?.uid) {
              const { ok } = await apiFetch(`/api/reminders/${data.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  date: data.date,
                  time: data.time,
                  firedAt: null,
                  status: 'pospuesto',
                  postponedUntil
                }),
              })
              if (ok) {
                window.dispatchEvent(new CustomEvent('reminders-updated', { detail: { justPostponedId: data.id } }))
              }
            } else {
              updateReminder(data.id, {
                date: data.date,
                time: data.time,
                firedAt: null,
                status: 'pospuesto',
                postponedUntil
              })
              window.dispatchEvent(new CustomEvent('reminders-updated', { detail: { justPostponedId: data.id } }))
            }
            setReminderPostponeOpen(false)
            setReminderOverlay(null)
            setCurrentAction(null)
            setDisplayedAction(null)
            setActiveTab('reminders')
            const time = data.time || '09:00'
            try {
              const dt = new Date(y, (m || 1) - 1, d || 1)
              const ddmm = dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
              setPostponedFeedbackToast(`✓ Tarea pospuesta para ${ddmm} · ${time}`)
            } catch {
              setPostponedFeedbackToast('✓ Tarea pospuesta')
            }
            setTimeout(() => setPostponedFeedbackToast(null), 3000)
          }}
        />
      )}

      {premiumPending && (
        <div className="action-screen__overlay action-screen__overlay--payment-pending" role="dialog" aria-labelledby="payment-pending-title" aria-modal="true">
          <BackButton onClick={() => setPremiumPending(false)} />
          <div className="action-screen__name-prompt-inner">
            <p id="payment-pending-title" className="action-screen__name-prompt-title">Flujo de pago (simulado)</p>
            <p className="action-screen__payment-pending-desc">Modo demo: el pago es simulado. Al confirmar se activa Premium en tu cuenta.</p>
            <div className="action-screen__name-prompt-actions">
              <button
                type="button"
                className="action-screen__name-prompt-btn action-screen__name-prompt-btn--secondary"
                onClick={() => setPremiumPending(false)}
                disabled={premiumPendingLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="action-screen__name-prompt-btn action-screen__name-prompt-btn--primary"
                disabled={premiumPendingLoading}
                onClick={async () => {
                  setPremiumPendingLoading(true)
                  try {
                    const { ok } = await apiFetch('/api/premium/activate', { method: 'POST' })
                    if (ok) {
                      const { setSessionFromCookie } = await import('../services/authService')
                      await setSessionFromCookie()
                      setUserPlan('premium')
                      setPremiumPending(false)
                      const { getCurrentUser } = await import('../services/authService')
                      const user = getCurrentUser()
                      if (user?.uid && !getDisplayName(user.uid)) {
                        setShowNamePrompt(true)
                        setNamePromptUid(user.uid)
                        setNamePromptValue('')
                      }
                    }
                  } finally {
                    setPremiumPendingLoading(false)
                  }
                }}
              >
                {premiumPendingLoading ? 'Activando…' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNamePrompt && namePromptUid && (
        <div className="action-screen__overlay action-screen__overlay--name-prompt" role="dialog" aria-labelledby="name-prompt-title" aria-modal="true">
          <BackButton
            onClick={() => {
              setShowNamePrompt(false)
              setNamePromptUid(null)
              setNamePromptValue('')
            }}
          />
          <div className="action-screen__name-prompt-inner">
            <p id="name-prompt-title" className="action-screen__name-prompt-title">¿Cómo te llamás?</p>
            <input
              type="text"
              className="action-screen__name-prompt-input"
              value={namePromptValue}
              onChange={(e) => setNamePromptValue(e.target.value)}
              placeholder="Tu nombre (opcional)"
              maxLength={60}
              aria-label="Tu nombre"
              autoFocus
            />
            <div className="action-screen__name-prompt-actions">
              <button
                type="button"
                className="action-screen__name-prompt-btn action-screen__name-prompt-btn--secondary"
                onClick={() => {
                  setShowNamePrompt(false)
                  setNamePromptUid(null)
                  setNamePromptValue('')
                }}
              >
                Ahora no
              </button>
              <button
                type="button"
                className="action-screen__name-prompt-btn action-screen__name-prompt-btn--primary"
                onClick={() => {
                  if (namePromptValue.trim()) setDisplayName(namePromptUid, namePromptValue.trim())
                  setShowNamePrompt(false)
                  setNamePromptUid(null)
                  setNamePromptValue('')
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSetPasswordModal && (
        <div className="action-screen__overlay action-screen__overlay--name-prompt" role="dialog" aria-labelledby="set-password-modal-title" aria-modal="true">
          <BackButton
            onClick={() => {
              if (!setPasswordLoading) {
                setShowSetPasswordModal(false)
                setSetPasswordNew('')
                setSetPasswordConfirm('')
                setSetPasswordError('')
                setSetPasswordSuccess(false)
                try { window.localStorage?.removeItem('control-want-set-password') } catch (_) {}
              }
            }}
          />
          <div className="action-screen__name-prompt-inner">
            {setPasswordSuccess ? (
              <div className="action-screen__set-password-success">
                <p className="action-screen__overlay-text action-screen__overlay-text--completion" role="status">
                  ✓ Contraseña creada
                </p>
                <p className="action-screen__name-prompt-desc">Ahora podés entrar con email cuando quieras.</p>
              </div>
            ) : (
              <>
                <p id="set-password-modal-title" className="action-screen__name-prompt-title">¿Crear contraseña para entrar con email?</p>
                <p className="action-screen__name-prompt-desc">No modifica tu acceso con Google. Solo suma otra forma de entrar.</p>
                <form onSubmit={handleSetPasswordSubmit} className="action-screen__set-password-form">
                  <input
                    type="password"
                    className="action-screen__name-prompt-input"
                    placeholder="Nueva contraseña"
                    value={setPasswordNew}
                    onChange={(e) => setSetPasswordNew(e.target.value)}
                    disabled={setPasswordLoading}
                    autoComplete="new-password"
                    aria-label="Nueva contraseña"
                  />
                  <input
                    type="password"
                    className="action-screen__name-prompt-input"
                    placeholder="Confirmar contraseña"
                    value={setPasswordConfirm}
                    onChange={(e) => setSetPasswordConfirm(e.target.value)}
                    disabled={setPasswordLoading}
                    autoComplete="new-password"
                    aria-label="Confirmar contraseña"
                  />
                  {setPasswordError && (
                    <p className="action-screen__set-password-error" role="alert">{setPasswordError}</p>
                  )}
                  <div className="action-screen__name-prompt-actions">
                    <button
                      type="button"
                      className="action-screen__name-prompt-btn action-screen__name-prompt-btn--secondary"
                      onClick={() => {
                        if (!setPasswordLoading) {
                          setShowSetPasswordModal(false)
                          setSetPasswordNew('')
                          setSetPasswordConfirm('')
                          setSetPasswordError('')
                          try { window.localStorage?.removeItem('control-want-set-password') } catch (_) {}
                        }
                      }}
                      disabled={setPasswordLoading}
                    >
                      Más tarde
                    </button>
                    <button
                      type="submit"
                      className="action-screen__name-prompt-btn action-screen__name-prompt-btn--primary"
                      disabled={setPasswordLoading}
                    >
                      {setPasswordLoading ? 'Guardando…' : 'Crear contraseña'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {notePromptAction && (
        <NotePrompt
          action={notePromptAction}
          onConfirm={handleNoteConfirm}
          onSkip={handleNoteSkip}
        />
      )}

      {!empezarFlow && !premiumViewOpen && !loginForPremium && (
        <BottomMenu
          activeTab={activeTab}
          onTabChange={(tab) => {
            setPreviousTab(activeTab)
            setActiveTab(tab)
          }}
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
