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

function normalizePostponed(items) {
  const now = Date.now()
  let changed = false
  const out = items.map((r) => {
    if (r.status === 'pospuesto' && r.postponedUntil) {
      const until = new Date(r.postponedUntil).getTime()
      if (until < now) {
        changed = true
        return { ...r, status: 'pending', postponedUntil: null }
      }
    }
    return r
  })
  return { items: out, changed }
}

function readAll() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed = safeParse(raw)
  const seen = new Set()
  const filtered = parsed.filter((r) => {
    if (!r || seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
  const { items, changed } = normalizePostponed(filtered)
  if (changed) writeAll(items)
  return items
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
    status: 'pending',
  }
  const items = readAll()
  items.push(reminder)
  writeAll(items)
  return reminder
}

export function updateReminder(id, { text, date, time, alarmEnabled, firedAt, status, postponedUntil }) {
  if (!id) return null
  const items = readAll()
  const idx = items.findIndex((r) => r.id === id)
  if (idx === -1) return null
  const updates = {
    text: String(text ?? items[idx].text ?? '').trim(),
    date: date ?? items[idx].date,
    time: time ?? items[idx].time,
    alarmEnabled: alarmEnabled !== undefined ? Boolean(alarmEnabled) : items[idx].alarmEnabled,
  }
  if (firedAt === null) updates.firedAt = null
  if (status !== undefined && ['pending', 'hecho', 'pospuesto'].includes(status)) {
    updates.status = status
    if (status === 'hecho') updates.firedAt = new Date().toISOString()
    if (status === 'pending') updates.postponedUntil = null
  }
  if (postponedUntil !== undefined) updates.postponedUntil = postponedUntil || null
  const updated = { ...items[idx], ...updates }
  if (updated.status === 'pospuesto' && updated.postponedUntil) {
    const now = Date.now()
    if (new Date(updated.postponedUntil).getTime() < now) {
      updated.status = 'pending'
      updated.postponedUntil = null
    }
  }
  items[idx] = updated
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
  const r = items[idx]
  items[idx] = {
    ...r,
    firedAt: new Date().toISOString(),
    status: r.status || 'pending',
  }
  writeAll(items)
}

export function clearAllReminders() {
  writeAll([])
}

