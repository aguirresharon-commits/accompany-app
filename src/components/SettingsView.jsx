// Ajustes: ritmo, reiniciar día, sonidos, Premium, ayuda
import { useState, useEffect, useCallback } from 'react'
import { ENERGY_LEVELS, ENERGY_LEVEL_KEYS } from '../data/actions'
import { EnergyLevelIcon } from './TaskIcon'
import BackButton from './BackButton'
import { apiFetch } from '../api/client'
import './SettingsView.css'

const SettingsView = ({
  currentEnergyLevel,
  onEnergyLevelChange,
  onRestartDay,
  soundsEnabled,
  onSoundsEnabledChange,
  isPremium: isPremiumProp,
  userPlan,
  onUpgrade,
  onOpenLogin,
}) => {
  const isPremium = isPremiumProp !== undefined ? isPremiumProp : userPlan === 'premium'
  const [currentUser, setCurrentUser] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [setPasswordNew, setSetPasswordNew] = useState('')
  const [setPasswordConfirm, setSetPasswordConfirm] = useState('')
  const [setPasswordLoading, setSetPasswordLoading] = useState(false)
  const [setPasswordError, setSetPasswordError] = useState('')

  useEffect(() => {
    let unsubscribe = () => {}
    import('../services/authService')
      .then(({ getCurrentUser, onAuthChange }) => {
        setCurrentUser(getCurrentUser())
        unsubscribe = onAuthChange(setCurrentUser)
      })
      .catch(() => {})
    return () => unsubscribe()
  }, [])

  const doLogout = () => {
    import('../services/authService')
      .then(({ logout }) => logout())
      .catch(() => {})
    setConfirmLogout(false)
  }

  const handleSetPassword = useCallback(
    async (e) => {
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
        setSetPasswordNew('')
        setSetPasswordConfirm('')
        setShowSetPassword(false)
      } catch (err) {
        setSetPasswordError(err?.message || 'Error de conexión.')
      } finally {
        setSetPasswordLoading(false)
      }
    },
    [setPasswordNew, setPasswordConfirm]
  )

  return (
    <div className="settings-view">
      <section className="settings-view__section">
        <h2 className="settings-view__title">Cuenta</h2>
        {currentUser ? (
          <>
            <p className="settings-view__desc settings-view__email" aria-label="Email">{currentUser.email || 'Sin email'}</p>
            {confirmLogout ? (
              <div className="settings-view__logout-confirm" role="dialog" aria-labelledby="logout-question">
                <p id="logout-question" className="settings-view__logout-question">
                  ¿Querés cerrar sesión?
                </p>
                <div className="settings-view__logout-btns">
                  <button
                    type="button"
                    className="settings-view__logout-btn settings-view__logout-btn--no"
                    onClick={() => setConfirmLogout(false)}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className="settings-view__logout-btn settings-view__logout-btn--yes"
                    onClick={doLogout}
                  >
                    Sí
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="settings-view__upgrade-btn"
                  onClick={() => setConfirmLogout(true)}
                >
                  Cerrar sesión
                </button>
                <button
                  type="button"
                  className="settings-view__upgrade-btn settings-view__upgrade-btn--link"
                  onClick={() => setShowSetPassword(true)}
                >
                  Crear contraseña interna
                </button>
                <p className="settings-view__hint">
                  Crear una contraseña te permite iniciar sesión con email sin usar Google. Esto no modifica tu cuenta de Google.
                </p>
                {showSetPassword && (
                  <div className="settings-view__set-password" role="dialog" aria-labelledby="set-password-title">
                    <p id="set-password-title" className="settings-view__desc">
                      Creá una contraseña para iniciar sesión con email sin Google.
                    </p>
                    <form onSubmit={handleSetPassword} className="settings-view__set-password-form">
                      <input
                        type="password"
                        className="settings-view__set-password-input"
                        placeholder="Nueva contraseña"
                        value={setPasswordNew}
                        onChange={(e) => setSetPasswordNew(e.target.value)}
                        disabled={setPasswordLoading}
                        autoComplete="new-password"
                      />
                      <input
                        type="password"
                        className="settings-view__set-password-input"
                        placeholder="Confirmar contraseña"
                        value={setPasswordConfirm}
                        onChange={(e) => setSetPasswordConfirm(e.target.value)}
                        disabled={setPasswordLoading}
                        autoComplete="new-password"
                      />
                      {setPasswordError && (
                        <p className="settings-view__set-password-error" role="alert">
                          {setPasswordError}
                        </p>
                      )}
                      <div className="settings-view__set-password-btns">
                        <button
                          type="button"
                          className="settings-view__logout-btn settings-view__logout-btn--no"
                          onClick={() => {
                            setShowSetPassword(false)
                            setSetPasswordError('')
                            setSetPasswordNew('')
                            setSetPasswordConfirm('')
                          }}
                          disabled={setPasswordLoading}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="settings-view__logout-btn settings-view__logout-btn--yes"
                          disabled={setPasswordLoading}
                        >
                          {setPasswordLoading ? 'Guardando…' : 'Crear contraseña'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <p className="settings-view__desc">Podés usar Control gratis sin cuenta.</p>
            {onOpenLogin && (
              <button
                type="button"
                className="settings-view__upgrade-btn"
                onClick={onOpenLogin}
              >
                Iniciar sesión
              </button>
            )}
          </>
        )}
      </section>
      <section className="settings-view__section">
        <h2 className="settings-view__title">Premium</h2>
        <p className="settings-view__desc">
          {isPremium
            ? 'Tenés acceso a: timer libre, notas, detalle del calendario, pausar racha, recordatorios ilimitados y borrarlos.'
            : 'Desbloqueá: timer con duración libre, notas al terminar tareas, detalle de cada día en el calendario, pausar la racha, recordatorios ilimitados y poder borrarlos.'}
        </p>
        {isPremium ? (
          <div className="settings-view__premium-active">
            <p className="settings-view__premium-badge">Premium activo</p>
            <button
              type="button"
              className="settings-view__upgrade-btn settings-view__upgrade-btn--link"
              onClick={onUpgrade}
            >
              Ver beneficios
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="settings-view__upgrade-btn"
              onClick={onUpgrade}
            >
              Hacerse Premium
            </button>
          </>
        )}
      </section>

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
          onClick={() => setConfirmRestart(true)}
          type="button"
        >
          Reiniciar día
        </button>
      </section>

      {confirmRestart && (
        <div
          className="settings-view__restart-overlay"
          role="dialog"
          aria-labelledby="restart-question"
          aria-describedby="restart-warning"
          aria-modal="true"
        >
          <BackButton onClick={() => setConfirmRestart(false)} />
          <div className="settings-view__restart-confirm">
            <p id="restart-warning" className="settings-view__restart-warning">
              Si reiniciás el día, todas las tareas de hoy se marcarán como no completadas y volverás a la pantalla para elegir una nueva tarea.
            </p>
            <p id="restart-question" className="settings-view__restart-question">
              ¿Estás seguro de hacerlo?
            </p>
            <div className="settings-view__restart-btns">
              <button
                type="button"
                className="settings-view__logout-btn settings-view__logout-btn--no"
                onClick={() => setConfirmRestart(false)}
              >
                No
              </button>
              <button
                type="button"
                className="settings-view__logout-btn settings-view__logout-btn--yes"
                onClick={() => {
                  onRestartDay?.()
                  setConfirmRestart(false)
                }}
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      )}

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
