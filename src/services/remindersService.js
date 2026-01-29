// Servicio de recordatorios (tareas puntuales) con persistencia local.
// No afecta rachas ni hábitos.

const STORAGE_KEY = 'control-app-reminders'

function safeParse(json) {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readAll() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  return safeParse(raw)
}

function writeAll(items) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    // Reprogramar notificaciones en la misma pestaña (storage solo dispara en otras pestañas)
    window.dispatchEvent(new CustomEvent('reminders-updated'))
  } catch (e) {
    console.warn('remindersService: no se pudo persistir', e)
  }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function listReminders() {
  return readAll()
}

export function addReminder({ text, date, time, alarmEnabled }) {
  const nowIso = new Date().toISOString()
  const reminder = {
    id: uid(),
    text: String(text || '').trim(),
    date, // YYYY-MM-DD
    time, // HH:mm
    alarmEnabled: Boolean(alarmEnabled),
    createdAt: nowIso,
    firedAt: null,
  }
  const items = readAll()
  items.push(reminder)
  writeAll(items)
  return reminder
}

export function updateReminder(id, { text, date, time, alarmEnabled }) {
  if (!id) return null
  const items = readAll()
  const idx = items.findIndex((r) => r.id === id)
  if (idx === -1) return null
  items[idx] = {
    ...items[idx],
    text: String(text ?? items[idx].text ?? '').trim(),
    date: date ?? items[idx].date,
    time: time ?? items[idx].time,
    alarmEnabled: alarmEnabled !== undefined ? Boolean(alarmEnabled) : items[idx].alarmEnabled,
  }
  writeAll(items)
  return items[idx]
}

export function deleteReminders(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return
  const set = new Set(ids)
  const items = readAll().filter((r) => !set.has(r.id))
  writeAll(items)
}

export function markReminderFired(id) {
  if (!id) return
  const items = readAll()
  const idx = items.findIndex((r) => r.id === id)
  if (idx === -1) return
  items[idx] = { ...items[idx], firedAt: new Date().toISOString() }
  writeAll(items)
}

export function clearAllReminders() {
  writeAll([])
}

