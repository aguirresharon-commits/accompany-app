import { useEffect, useRef } from 'react'
import { listReminders, updateReminder } from '../services/remindersService'
import { apiFetch } from '../api/client'
import { onAuthChange } from '../services/authService'

const OPEN_TAB_KEY = 'control-open-tab'

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

function pickNextDue(nowMs, items, skipIds = new Set()) {
  let best = null
  let bestMs = Infinity
  let overdue = null
  let overdueMs = -Infinity
  for (const r of items) {
    if (!r || !r.alarmEnabled) continue
    if (r.status === 'hecho' || r.firedAt) continue
    if (skipIds && skipIds.has(r.id)) continue
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
  const skipIdsRef = useRef(new Set())

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
      const skipIds = skipIdsRef.current
      const next = pickNextDue(now, items, skipIds)
      if (!next) return
      const due = toDueTimeMs(next)
      const delay = Math.max(0, due - now)

      timerRef.current = setTimeout(async () => {
        try {
          skipIds.add(next.id)
          const currentUser = userRef.current
          if (next.status === 'pospuesto' && next.postponedUntil) {
            if (currentUser?.uid) {
              await apiFetch(`/api/reminders/${next.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'pending', postponedUntil: null }),
              }).catch(() => {})
            } else {
              const { updateReminder } = await import('../services/remindersService')
              updateReminder(next.id, { status: 'pending', postponedUntil: null })
            }
          }
          const reminderToShow = { ...next, status: 'pending', postponedUntil: null }
          const event = new CustomEvent('reminder-due', {
            detail: { reminder: reminderToShow },
          })
          window.dispatchEvent(event)

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
        } finally {
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
    const onRemindersUpdated = (e) => {
      skipIdsRef.current.clear()
      const justPostponed = e?.detail?.justPostponedId
      if (justPostponed) skipIdsRef.current.add(justPostponed)
      schedule()
    }

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

