// Vista Recordatorios: lista de tareas puntuales con fecha/hora.
import { useEffect, useMemo, useState } from 'react'
import AddReminderModal from './AddReminderModal'
import { addReminder, updateReminder, deleteReminders, listReminders, clearAllReminders } from '../services/remindersService'
import { getTodayDate } from '../utils/storage'
import './RemindersView.css'

const FREE_REMINDERS_LAST_DAY_KEY = 'control-app-reminders-free-date'

const formatDate = (dateStr) => {
  try {
    const [y, m, d] = String(dateStr).split('-').map(Number)
    if (!y || !m || !d) return dateStr
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  } catch {
    return dateStr
  }
}

const toTimestamp = (r) => {
  try {
    const [y, m, d] = String(r.date).split('-').map(Number)
    const [hh, mm] = String(r.time).split(':').map(Number)
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0)
    return dt.getTime()
  } catch {
    return 0
  }
}

const FREE_REMINDERS_LIMIT = 2

const RemindersView = ({ isPremium = false, onRequestPremium }) => {
  const [items, setItems] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const canAddNew = isPremium || items.length < FREE_REMINDERS_LIMIT

  const reload = () => {
    setItems(listReminders())
  }

  useEffect(() => {
    // Usuarios free: al día siguiente se limpian los recordatorios para poder escribir 2 de nuevo.
    if (!isPremium && typeof window !== 'undefined' && window.localStorage) {
      const today = getTodayDate()
      const lastDay = window.localStorage.getItem(FREE_REMINDERS_LAST_DAY_KEY)
      if (lastDay !== today) {
        clearAllReminders()
        window.localStorage.setItem(FREE_REMINDERS_LAST_DAY_KEY, today)
      }
    }
    reload()
    const onStorage = (e) => {
      if (e.key === 'control-app-reminders') reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [isPremium])

  const sorted = useMemo(() => {
    const arr = [...items]
    arr.sort((a, b) => toTimestamp(a) - toTimestamp(b))
    return arr
  }, [items])

  return (
    <div className="reminders-view">
      <div className="reminders-view__header">
        <h2 className="reminders-view__title">Recordatorios</h2>
        <div className="reminders-view__actions">
          {isPremium && (
            <button
              type="button"
              className="reminders-view__btn reminders-view__btn--trash"
              onClick={() => {
                if (selectedIds.size === 0) return
                deleteReminders([...selectedIds])
                setSelectedIds(new Set())
                reload()
              }}
              disabled={selectedIds.size === 0}
              aria-label="Borrar seleccionados"
              title="Borrar seleccionados"
            >
              <svg className="reminders-view__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="reminders-view__btn reminders-view__btn--add"
            onClick={() => {
              if (!canAddNew) {
                onRequestPremium?.()
                return
              }
              setEditingReminder(null)
              setAddOpen(true)
            }}
            disabled={!canAddNew}
            aria-label={canAddNew ? 'Agregar recordatorio' : 'Límite free alcanzado'}
            title={canAddNew ? 'Agregar' : 'Con Premium podés agregar más'}
          >
            +
          </button>
        </div>
      </div>

      {!isPremium && items.length >= FREE_REMINDERS_LIMIT && (
        <p className="reminders-view__hint">
          Límite free: {FREE_REMINDERS_LIMIT} recordatorios. Con Premium podés agregar más.
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="reminders-view__empty">No tenés recordatorios todavía.</p>
      ) : (
        <ul className="reminders-view__list" aria-label="Lista de recordatorios">
          {sorted.map((r) => (
            <li
              key={r.id}
              className={`reminders-view__item ${isPremium && selectedIds.has(r.id) ? 'reminders-view__item--selected' : ''}`}
            >
              {isPremium && (
                <button
                  type="button"
                  className="reminders-view__check"
                  onClick={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(r.id)) next.delete(r.id)
                      else next.add(r.id)
                      return next
                    })
                  }}
                  aria-label={selectedIds.has(r.id) ? 'Quitar de selección' : 'Seleccionar'}
                >
                  {selectedIds.has(r.id) ? (
                    <span className="reminders-view__check-mark" aria-hidden="true">✓</span>
                  ) : (
                    <span className="reminders-view__check-empty" aria-hidden="true" />
                  )}
                </button>
              )}
              <div className="reminders-view__main">
                <p className="reminders-view__text">{r.text}</p>
                <p className="reminders-view__meta">
                  {formatDate(r.date)} · {r.time}
                </p>
              </div>
              {r.alarmEnabled && (
                <span className="reminders-view__alarm" aria-hidden="true" />
              )}
              <button
                type="button"
                className="reminders-view__edit"
                onClick={() => {
                  setEditingReminder(r)
                  setAddOpen(true)
                }}
                aria-label="Editar recordatorio"
              >
                <svg className="reminders-view__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {addOpen && (
        <AddReminderModal
          onClose={() => {
            setAddOpen(false)
            setEditingReminder(null)
          }}
          initial={editingReminder}
          onCreate={(data) => {
            if (data.id) {
              updateReminder(data.id, { text: data.text, date: data.date, time: data.time, alarmEnabled: data.alarmEnabled })
            } else {
              addReminder(data)
            }
            reload()
            setEditingReminder(null)
          }}
        />
      )}
    </div>
  )
}

export default RemindersView

