import { useEffect, useRef } from 'react'
import { listReminders, updateReminder } from '../services/remindersService'
import { apiFetch } from '../api/client'
import { onAuthChange } from '../services/authService'
import { isReminderOverlayVisible } from '../state/reminderOverlayState'

const OPEN_TAB_KEY = 'control-open-tab'
const OVERDUE_WINDOW_MS = 86400000 // 24 h

function toDueTimeMs(r) {
  try {
    if (r.status === 'pospuesto' && r.postponedUntil) {
      const dt = new Date(r.postponedUntil)
      return isNaN(dt.getTime()) ? 0 : dt.getTime()
    }
    const [y, m, d] = String(r.date).split('-').map(Number)
    const [hh, mm] = String(r.time).split(':').map(Number)
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0)
    return dt.getTime()
  } catch {
    return 0
  }
}

/**
 * Scheduler centralizado: un timer por recordatorio programado.
 * scheduledReminders = Map<reminderId, timerId>
 * activeReminderId = el que disparó reminder-due y sigue "activo" hasta posponer/editar/reinicio.
 */
export function useRemindersScheduler() {
  const scheduledRemindersRef = useRef(new Map())
  const activeReminderIdRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    function clearAllScheduledTimers() {
      const map = scheduledRemindersRef.current
      map.forEach((timerId) => {
        if (timerId != null) clearTimeout(timerId)
      })
      map.clear()
    }

    async function updatePospuestoToPending(r, user) {
      if (r.status !== 'pospuesto' || !r.postponedUntil) return
      if (user?.uid) {
        await apiFetch(`/api/reminders/${r.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'pending', postponedUntil: null }),
        }).catch(() => {})
      } else {
        updateReminder(r.id, { status: 'pending', postponedUntil: null })
      }
    }

    function fireReminder(r, user) {
      const id = r.id
      scheduledRemindersRef.current.delete(id)

      if (isReminderOverlayVisible()) {
        return
      }

      activeReminderIdRef.current = id

      updatePospuestoToPending(r, user).then(() => {
        const reminderToShow = { ...r, status: 'pending', postponedUntil: null }
        window.dispatchEvent(
          new CustomEvent('reminder-due', { detail: { reminder: reminderToShow } })
        )

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const n = new Notification(reminderToShow.text || 'Recordatorio', {
            tag: reminderToShow.id,
            data: { tab: 'reminders' },
          })
          n.onclick = () => {
            try {
              window.focus?.()
            } catch {
              // ignore
            }
            try {
              window.localStorage?.setItem(OPEN_TAB_KEY, 'reminders')
            } catch {
              // ignore
            }
          }
        }
      })
    }

    function runWithItems(items, user) {
      clearAllScheduledTimers()
      const now = Date.now()
      const activeId = activeReminderIdRef.current

      for (const r of items) {
        if (!r || !r.alarmEnabled) continue
        if (r.status === 'hecho' || r.firedAt) continue
        if (r.id === activeId) continue

        const dueMs = toDueTimeMs(r)
        if (!dueMs) continue
        if (dueMs < now - OVERDUE_WINDOW_MS) continue

        const delay = Math.max(0, dueMs - now)
        const timerId = setTimeout(() => {
          fireReminder(r, userRef.current)
        }, delay)
        scheduledRemindersRef.current.set(r.id, timerId)
      }
    }

    function schedule() {
      const user = userRef.current
      if (user?.uid) {
        apiFetch('/api/reminders')
          .then(({ ok, data }) => {
            if (ok && Array.isArray(data)) runWithItems(data, user)
          })
          .catch(() => {})
      } else {
        let items = listReminders()
        const now = Date.now()
        for (const r of items) {
          if (r.status === 'pospuesto' && r.postponedUntil) {
            const due = new Date(r.postponedUntil).getTime()
            if (!isNaN(due) && due <= now) {
              updateReminder(r.id, { status: 'pending', postponedUntil: null })
            }
          }
        }
        items = listReminders()
        runWithItems(items, null)
      }
    }

    const unsubscribeAuth = onAuthChange((user) => {
      userRef.current = user
      schedule()
    })

    const onVisibility = () => schedule()
    const onStorage = (e) => {
      if (e.key === 'control-app-reminders') schedule()
    }
    const onRemindersUpdated = () => schedule()
    const onOverlayClosed = () => {
      activeReminderIdRef.current = null
      schedule()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisibility)
    window.addEventListener('storage', onStorage)
    window.addEventListener('reminders-updated', onRemindersUpdated)
    window.addEventListener('reminder-overlay-closed', onOverlayClosed)

    return () => {
      clearAllScheduledTimers()
      unsubscribeAuth()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisibility)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('reminders-updated', onRemindersUpdated)
      window.removeEventListener('reminder-overlay-closed', onOverlayClosed)
    }
  }, [])
}
