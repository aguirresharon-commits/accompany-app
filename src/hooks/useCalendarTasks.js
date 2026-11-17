import { useEffect, useState } from 'react'

export const CALENDAR_TASK_LIMIT = 5
export const PRIORITIES = { alta: 'Alta', media: 'Media', baja: 'Baja' }
const CHANGE_EVENT = 'control-calendar-updated'

function readTasks(key) {
  const tasks = JSON.parse(localStorage.getItem(key) || '[]')
  return Array.isArray(tasks) ? tasks : []
}

export function useCalendarTasks(userId) {
  const key = `control-calendar:${userId ?? 'guest'}`
  const [snapshot, setSnapshot] = useState(null)

  useEffect(() => {
    function refresh() {
      try {
        setSnapshot({ key, tasks: readTasks(key), error: false })
      } catch {
        setSnapshot({ key, tasks: [], error: true })
      }
    }

    function handleStorage(event) {
      if (event.key === key || event.key === null) refresh()
    }

    refresh()
    window.addEventListener('storage', handleStorage)
    window.addEventListener(CHANGE_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(CHANGE_EVENT, refresh)
    }
  }, [key])

  function update(transform) {
    const next = transform(readTasks(key))
    if (!next) return false
    localStorage.setItem(key, JSON.stringify(next))
    window.dispatchEvent(new Event(CHANGE_EVENT))
    return true
  }

  function addTask(date, task) {
    return update(tasks => {
      if (tasks.filter(item => item.date === date).length >= CALENDAR_TASK_LIMIT) return null
      return [...tasks, { ...task, id: crypto.randomUUID(), date, completed: false }]
    })
  }

  function toggleTask(id) {
    return update(tasks => tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const current = snapshot?.key === key ? snapshot : null
  return { tasks: current?.tasks ?? [], error: current?.error ?? false, addTask, toggleTask }
}
