import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import State from '../models/State.js'

const router = Router()

router.use(authMiddleware)

/**
 * GET /api/premium
 * Devuelve { premium: boolean } según userPlan del estado del usuario.
 * Si no tiene estado, premium = false.
 */
router.get('/', async (req, res) => {
  try {
    const state = await State.findOne({ userId: req.userId }).lean()
    const premium = state?.userPlan === 'premium'
    return res.json({ premium })
  } catch (err) {
    console.error('GET /api/premium error:', err)
    return res.status(500).json({ error: 'Error al obtener premium' })
  }
})

/**
 * POST /api/premium/activate
 * Activa premium: actualiza userPlan a 'premium' en el estado del usuario.
 * Crea estado con userPlan premium si no existe (upsert).
 */
router.post('/activate', async (req, res) => {
  try {
    await State.findOneAndUpdate(
      { userId: req.userId },
      { $set: { userPlan: 'premium', userId: req.userId } },
      { upsert: true, new: true }
    )
    return res.json({ premium: true })
  } catch (err) {
    console.error('POST /api/premium/activate error:', err)
    return res.status(500).json({ error: 'Error al activar premium' })
  }
})

export default router
