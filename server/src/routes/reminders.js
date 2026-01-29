import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Reminder from '../models/Reminder.js'

const router = Router()

router.use(authMiddleware)

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toResponse(doc) {
  if (!doc) return null
  const o = doc.toObject ? doc.toObject() : doc
  const { _id, userId, __v, updatedAt, ...rest } = o
  return rest
}

/**
 * GET /api/reminders
 * Lista los recordatorios del usuario.
 */
router.get('/', async (req, res) => {
  try {
    const list = await Reminder.find({ userId: req.userId }).lean()
    const payload = list.map((r) => {
      const { _id, userId, __v, updatedAt, ...rest } = r
      return rest
    })
    return res.json(payload)
  } catch (err) {
    console.error('GET /api/reminders error:', err)
    return res.status(500).json({ error: 'Error al listar recordatorios' })
  }
})

/**
 * POST /api/reminders
 * Body: { text, date, time, alarmEnabled }
 * Crea un recordatorio. Devuelve el creado (misma forma que frontend).
 */
router.post('/', async (req, res) => {
  try {
    const { text, date, time, alarmEnabled } = req.body || {}
    const reminder = await Reminder.create({
      userId: req.userId,
      id: uid(),
      text: String(text ?? '').trim(),
      date: date ?? '',
      time: time ?? '',
      alarmEnabled: Boolean(alarmEnabled),
      createdAt: new Date(),
      firedAt: null
    })
    return res.status(201).json(toResponse(reminder))
  } catch (err) {
    console.error('POST /api/reminders error:', err)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Datos de recordatorio inválidos' })
    }
    return res.status(500).json({ error: 'Error al crear recordatorio' })
  }
})

/**
 * PATCH /api/reminders/:id
 * Body: { text?, date?, time?, alarmEnabled? }
 * Actualiza el recordatorio. 404 si no existe o no es del usuario.
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { text, date, time, alarmEnabled } = req.body || {}
    const updates = {}
    if (text !== undefined) updates.text = String(text).trim()
    if (date !== undefined) updates.date = date
    if (time !== undefined) updates.time = time
    if (alarmEnabled !== undefined) updates.alarmEnabled = Boolean(alarmEnabled)
    if (Object.keys(updates).length === 0) {
      const r = await Reminder.findOne({ userId: req.userId, id }).lean()
      if (!r) return res.status(404).json({ error: 'Recordatorio no encontrado' })
      const { _id, userId, __v, updatedAt, ...rest } = r
      return res.json(rest)
    }
    const updated = await Reminder.findOneAndUpdate(
      { userId: req.userId, id },
      { $set: updates },
      { new: true }
    ).lean()
    if (!updated) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' })
    }
    const { _id, userId, __v, updatedAt, ...rest } = updated
    return res.json(rest)
  } catch (err) {
    console.error('PATCH /api/reminders error:', err)
    return res.status(500).json({ error: 'Error al actualizar recordatorio' })
  }
})

/**
 * DELETE /api/reminders
 * Body: { ids: string[] }
 * Elimina los recordatorios indicados del usuario.
 */
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids es requerido (array no vacío)' })
    }
    const set = new Set(ids.map(String))
    await Reminder.deleteMany({ userId: req.userId, id: { $in: [...set] } })
    return res.status(204).send()
  } catch (err) {
    console.error('DELETE /api/reminders error:', err)
    return res.status(500).json({ error: 'Error al eliminar recordatorios' })
  }
})

/**
 * POST /api/reminders/:id/fired
 * Marca firedAt del recordatorio. 404 si no existe o no es del usuario.
 */
router.post('/:id/fired', async (req, res) => {
  try {
    const { id } = req.params
    const updated = await Reminder.findOneAndUpdate(
      { userId: req.userId, id },
      { $set: { firedAt: new Date() } },
      { new: true }
    ).lean()
    if (!updated) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' })
    }
    const { _id, userId, __v, updatedAt, ...rest } = updated
    return res.json(rest)
  } catch (err) {
    console.error('POST /api/reminders/:id/fired error:', err)
    return res.status(500).json({ error: 'Error al marcar recordatorio' })
  }
})

export default router
