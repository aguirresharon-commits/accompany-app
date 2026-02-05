// Vista Recordatorios: lista de tareas puntuales con fecha/hora.
// Con usuario logueado → fuente de verdad: backend. Sin usuario → localStorage.
import { useCallback, useEffect, useMemo, useState } from 'react'
import AddReminderModal from './AddReminderModal'
import { addReminder, updateReminder, deleteReminders, listReminders, clearAllReminders } from '../services/remindersService'
import { getTodayDate } from '../utils/storage'
import { apiFetch } from '../api/client'
import { getCurrentUser, onAuthChange } from '../services/authService'
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
  const [remindersError, setRemindersError] = useState(null)

  const canAddNew = isPremium || items.length < FREE_REMINDERS_LIMIT

  // Refrescar lista: con usuario → GET backend; sin usuario → localStorage. No mezclar fuentes.
  const refreshList = useCallback(() => {
    const user = getCurrentUser()
    if (user?.uid) {
      apiFetch('/api/reminders')
        .then(({ ok, data }) => {
          if (ok && Array.isArray(data)) {
            setItems(data)
            setRemindersError(null)
          } else setRemindersError('No se pudo sincronizar. Revisá tu conexión.')
        })
        .catch(() => setRemindersError('No se pudo sincronizar. Revisá tu conexión.'))
    } else {
      setItems(listReminders())
    }
  }, [])

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
    refreshList()
    const onStorage = (e) => {
      if (e.key === 'control-app-reminders') refreshList()
    }
    const onRemindersUpdated = () => refreshList()
    window.addEventListener('storage', onStorage)
    window.addEventListener('reminders-updated', onRemindersUpdated)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('reminders-updated', onRemindersUpdated)
    }
  }, [isPremium, refreshList])

  // Con usuario logueado: cargar desde backend. Sin usuario: desde localStorage.
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setRemindersError(null)
      if (user?.uid) {
        apiFetch('/api/reminders')
          .then(({ ok, data }) => {
            if (ok && Array.isArray(data)) setItems(data)
            else setRemindersError('No se pudo sincronizar. Revisá tu conexión.')
          })
          .catch(() => setRemindersError('No se pudo sincronizar. Revisá tu conexión.'))
      } else {
        setItems(listReminders())
      }
    })
    return unsubscribe
  }, [])

  // Estados válidos: pending | pospuesto | hecho. Pospuestos vencidos (postponedUntil < now) se muestran como pending.
  const { pending, postponed, done } = useMemo(() => {
    const now = Date.now()
    const p = []
    const post = []
    const d = []
    for (const r of items) {
      const s = r.status || (r.firedAt ? 'hecho' : 'pending')
      const isPostponedOverdue = s === 'pospuesto' && r.postponedUntil && new Date(r.postponedUntil).getTime() < now
      const effectiveStatus = isPostponedOverdue ? 'pending' : s
      if (effectiveStatus === 'hecho') d.push(r)
      else if (effectiveStatus === 'pospuesto') post.push(r)
      else p.push(r)
    }
    const sortByDue = (arr) => arr.sort((a, b) => toTimestamp(a) - toTimestamp(b))
    const sortPostponed = (arr) =>
      arr.sort((a, b) => {
        const da = a.postponedUntil ? new Date(a.postponedUntil).getTime() : 0
        const db = b.postponedUntil ? new Date(b.postponedUntil).getTime() : 0
        return da - db
      })
    return {
      pending: sortByDue(p),
      postponed: sortPostponed(post),
      done: sortByDue(d),
    }
  }, [items])

  const formatPostponedUntil = (r) => {
    if (r.postponedUntil) {
      try {
        const dt = new Date(r.postponedUntil)
        const ddmm = dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
        const hhmm = dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        return `${ddmm} · ${hhmm}`
      } catch {}
    }
    return formatDate(r.date) + ' · ' + r.time
  }

  return (
    <div className="reminders-view">
      {remindersError && (
        <p
          role="alert"
          className="reminders-view__error"
          style={{ padding: '0.5rem 1rem', margin: 0, background: '#3d1a4a', color: '#f0e6f0', fontSize: '0.9rem' }}
        >
          {remindersError}
        </p>
      )}
      <div className="reminders-view__header">
        <h2 className="reminders-view__title">Recordatorios</h2>
        <div className="reminders-view__actions">
          {isPremium && (
            <button
              type="button"
              className="reminders-view__btn reminders-view__btn--trash"
              onClick={async () => {
                if (selectedIds.size === 0) return
                const ids = [...selectedIds]
                const user = getCurrentUser()
                if (user?.uid) {
                  const { ok } = await apiFetch('/api/reminders', {
                    method: 'DELETE',
                    body: JSON.stringify({ ids })
                  })
                  if (ok) {
                    setItems((prev) => prev.filter((r) => !ids.includes(r.id)))
                    setSelectedIds(new Set())
                    window.dispatchEvent(new CustomEvent('reminders-updated'))
                  }
                } else {
                  deleteReminders(ids)
                  setSelectedIds(new Set())
                  refreshList()
                }
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
        <div className="reminders-view__premium-block">
          <p className="reminders-view__hint">Función Premium. Límite free: {FREE_REMINDERS_LIMIT} recordatorios.</p>
          {onRequestPremium && (
            <button type="button" className="reminders-view__premium-cta" onClick={onRequestPremium}>
              Ver Premium
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <p className="reminders-view__empty">No tenés recordatorios todavía.</p>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="reminders-view__section" aria-label="Pendientes">
              <h3 className="reminders-view__section-title">Pendientes</h3>
              <ul className="reminders-view__list">
                {pending.map((r) => (
                  <li
                    key={r.id}
                    className={`reminders-view__item ${isPremium && selectedIds.has(r.id) ? 'reminders-view__item--selected' : ''}`}
                  >
                    {isPremium && (
                      <button type="button" className="reminders-view__check" onClick={() => { setSelectedIds((prev) => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n }) }} aria-label={selectedIds.has(r.id) ? 'Quitar de selección' : 'Seleccionar'}>
                        {selectedIds.has(r.id) ? <span className="reminders-view__check-mark" aria-hidden="true">✓</span> : <span className="reminders-view__check-empty" aria-hidden="true" />}
                      </button>
                    )}
                    <div className="reminders-view__main">
                      <p className="reminders-view__text">{r.text}</p>
                      <p className="reminders-view__meta">{formatDate(r.date)} · {r.time}</p>
                    </div>
                    {r.alarmEnabled && <span className="reminders-view__alarm" aria-hidden="true" />}
                    {isPremium && <button type="button" className="reminders-view__edit" onClick={() => { setEditingReminder(r); setAddOpen(true) }} aria-label="Editar recordatorio"><svg className="reminders-view__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {postponed.length > 0 && (
            <section className="reminders-view__section" aria-label="Pospuestas">
              <h3 className="reminders-view__section-title">Pospuestas</h3>
              <ul className="reminders-view__list">
                {postponed.map((r) => (
                  <li
                    key={r.id}
                    className={`reminders-view__item reminders-view__item--pospuesto ${isPremium && selectedIds.has(r.id) ? 'reminders-view__item--selected' : ''}`}
                  >
                    {isPremium && (
                      <button type="button" className="reminders-view__check" onClick={() => { setSelectedIds((prev) => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n }) }} aria-label={selectedIds.has(r.id) ? 'Quitar de selección' : 'Seleccionar'}>
                        {selectedIds.has(r.id) ? <span className="reminders-view__check-mark" aria-hidden="true">✓</span> : <span className="reminders-view__check-empty" aria-hidden="true" />}
                      </button>
                    )}
                    <span className="reminders-view__clock" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></span>
                    <div className="reminders-view__main">
                      <p className="reminders-view__text">{r.text}</p>
                      <p className="reminders-view__meta reminders-view__meta--postponed">⏰ Pospuesta para {formatPostponedUntil(r)}</p>
                    </div>
                    {isPremium && <button type="button" className="reminders-view__edit" onClick={() => { setEditingReminder(r); setAddOpen(true) }} aria-label="Editar recordatorio"><svg className="reminders-view__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {done.length > 0 && (
            <section className="reminders-view__section" aria-label="Hechas">
              <h3 className="reminders-view__section-title">Hechas</h3>
              <ul className="reminders-view__list">
                {done.map((r) => (
                  <li
                    key={r.id}
                    className={`reminders-view__item reminders-view__item--hecho ${isPremium && selectedIds.has(r.id) ? 'reminders-view__item--selected' : ''}`}
                  >
                    {isPremium && (
                      <button type="button" className="reminders-view__check" onClick={() => { setSelectedIds((prev) => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n }) }} aria-label={selectedIds.has(r.id) ? 'Quitar de selección' : 'Seleccionar'}>
                        {selectedIds.has(r.id) ? <span className="reminders-view__check-mark" aria-hidden="true">✓</span> : <span className="reminders-view__check-empty" aria-hidden="true" />}
                      </button>
                    )}
                    <span className="reminders-view__done-icon" aria-hidden="true">✓</span>
                    <div className="reminders-view__main">
                      <p className="reminders-view__text">{r.text}</p>
                      <p className="reminders-view__meta">{formatDate(r.date)} · {r.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {addOpen && (
        <AddReminderModal
          onClose={() => {
            setAddOpen(false)
            setEditingReminder(null)
          }}
          initial={editingReminder}
          onCreate={async (data) => {
            const user = getCurrentUser()
            if (user?.uid) {
              if (data.id) {
                const body = { text: data.text, date: data.date, time: data.time, alarmEnabled: data.alarmEnabled }
                const editing = items.find((x) => x.id === data.id)
                if (editing?.status === 'pospuesto') {
                  const [y, m, d] = String(data.date).split('-').map(Number)
                  const [hh, mm] = String(data.time || '09:00').split(':').map(Number)
                  body.postponedUntil = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString()
                }
                const { ok, data: res } = await apiFetch(`/api/reminders/${data.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify(body)
                })
                if (ok && res) {
                  setItems((prev) => prev.map((r) => (r.id === res.id ? res : r)))
                  window.dispatchEvent(new CustomEvent('reminders-updated'))
                }
              } else {
                const { ok, data: res } = await apiFetch('/api/reminders', {
                  method: 'POST',
                  body: JSON.stringify({
                    text: data.text,
                    date: data.date,
                    time: data.time,
                    alarmEnabled: data.alarmEnabled
                  })
                })
                if (ok && res) {
                  setItems((prev) => [...prev, res])
                  window.dispatchEvent(new CustomEvent('reminders-updated'))
                }
              }
            } else {
              if (data.id) {
                const updates = { text: data.text, date: data.date, time: data.time, alarmEnabled: data.alarmEnabled }
                const editing = items.find((x) => x.id === data.id)
                if (editing?.status === 'pospuesto') {
                  const [y, m, d] = String(data.date).split('-').map(Number)
                  const [hh, mm] = String(data.time || '09:00').split(':').map(Number)
                  updates.postponedUntil = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString()
                }
                updateReminder(data.id, updates)
              } else {
                addReminder(data)
              }
              refreshList()
            }
            setEditingReminder(null)
          }}
        />
      )}
    </div>
  )
}

export default RemindersView

