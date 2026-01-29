import { useEffect, useRef } from 'react'
import { listReminders, markReminderFired } from '../services/remindersService'

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

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const schedule = () => {
      clear()
      const now = Date.now()
      const items = listReminders()
      const next = pickNextDue(now, items)
      if (!next) return
      const due = toDueTimeMs(next)
      // Si ya pasó (hasta 1 hora), disparar inmediatamente (delay 0)
      const delay = Math.max(0, due - now)

      timerRef.current = setTimeout(() => {
        try {
          // Siempre disparar evento personalizado para notificación en pantalla (funciona siempre)
          const event = new CustomEvent('reminder-due', {
            detail: { reminder: next },
          })
          window.dispatchEvent(event)

          // También intentar Notification API del navegador (si tiene permiso)
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
          markReminderFired(next.id)
          schedule()
        }
      }, delay)
    }

    const onVisibility = () => {
      // Al volver a foco, re-evaluar próximos recordatorios.
      schedule()
    }

    const onStorage = (e) => {
      if (e.key === 'control-app-reminders') schedule()
    }

    const onRemindersUpdated = () => schedule()

    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisibility)
    window.addEventListener('storage', onStorage)
    window.addEventListener('reminders-updated', onRemindersUpdated)
    return () => {
      clear()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisibility)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('reminders-updated', onRemindersUpdated)
    }
  }, [])
}

