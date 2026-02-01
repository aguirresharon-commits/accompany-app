import { useEffect, useRef } from 'react'
import { listReminders, markReminderFired } from '../services/remindersService'
import { apiFetch } from '../api/client'
import { onAuthChange } from '../services/authService'

const OPEN_TAB_KEY = 'control-open-tab'

function toDueTimeMs(r) {
  try {
    const [y, m, d] = String(r.date).split('-').map(Number)
    const [hh, mm] = String(r.time).split(':').map(Number)
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0)
    return dt.getTime()
  } catch {
    return 0
  }
}

function pickNextDue(nowMs, items) {
  let best = null
  let bestMs = Infinity
  let overdue = null
  let overdueMs = -Infinity
  for (const r of items) {
    if (!r || !r.alarmEnabled) continue
    if (r.firedAt) continue
    const due = toDueTimeMs(r)
    if (!due) continue
    // Si ya pasó (hasta 24 h atrás), disparar al abrir la app
    if (due <= nowMs && due >= nowMs - 86400000) {
      if (due > overdueMs) {
        overdue = r
        overdueMs = due
      }
      continue
    }
    // Si es futuro, buscar el más próximo
    if (due > nowMs && due < bestMs) {
      best = r
      bestMs = due
    }
  }
  // Priorizar disparar uno vencido inmediatamente
  return overdue || best
}

export function useRemindersScheduler() {
  const timerRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const runWithItems = (items) => {
      clear()
      const now = Date.now()
      const next = pickNextDue(now, items)
      if (!next) return
      const due = toDueTimeMs(next)
      const delay = Math.max(0, due - now)

      timerRef.current = setTimeout(() => {
        try {
          const event = new CustomEvent('reminder-due', {
            detail: { reminder: next },
          })
          window.dispatchEvent(event)

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const n = new Notification(next.text || 'Recordatorio', {
              tag: next.id,
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
        } finally {
          const currentUser = userRef.current
          if (currentUser?.uid) {
            apiFetch(`/api/reminders/${next.id}/fired`, { method: 'POST' }).catch(() => {})
          } else {
            markReminderFired(next.id)
          }
          schedule()
        }
      }, delay)
    }

    const schedule = () => {
      clear()
      const user = userRef.current
      if (user?.uid) {
        apiFetch('/api/reminders')
          .then(({ ok, data }) => {
            if (ok && Array.isArray(data)) runWithItems(data)
          })
          .catch(() => {})
      } else {
        const items = listReminders()
        runWithItems(items)
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

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisibility)
    window.addEventListener('storage', onStorage)
    window.addEventListener('reminders-updated', onRemindersUpdated)

    return () => {
      clear()
      unsubscribeAuth()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisibility)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('reminders-updated', onRemindersUpdated)
    }
  }, [])
}

