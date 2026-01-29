import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import State from '../models/State.js'

const router = Router()

router.use(authMiddleware)

/**
 * GET /api/state
 * Devuelve el estado de la app del usuario autenticado.
 * 404 si no existe (el frontend puede usar estado por defecto).
 */
router.get('/', async (req, res) => {
  try {
    const state = await State.findOne({ userId: req.userId }).lean()
    if (!state) {
      return res.status(404).json({ error: 'Estado no encontrado' })
    }
    const { _id, userId, __v, createdAt, updatedAt, ...payload } = state
    return res.json(payload)
  } catch (err) {
    console.error('GET /api/state error:', err)
    return res.status(500).json({ error: 'Error al obtener el estado' })
  }
})

/**
 * PUT /api/state
 * Crea o actualiza el estado del usuario (upsert).
 * Body: mismo shape que control-app-state (sin userId).
 */
router.put('/', async (req, res) => {
  try {
    const body = req.body || {}
    const update = { ...body, userId: req.userId }
    const state = await State.findOneAndUpdate(
      { userId: req.userId },
      update,
      { upsert: true, new: true, runValidators: true }
    ).lean()
    const { _id, userId, __v, createdAt, updatedAt, ...payload } = state
    return res.json(payload)
  } catch (err) {
    console.error('PUT /api/state error:', err)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Datos de estado inválidos' })
    }
    return res.status(500).json({ error: 'Error al guardar el estado' })
  }
})

export default router
