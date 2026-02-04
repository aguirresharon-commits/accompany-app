import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import State from '../models/State.js'

const router = Router()

router.use(authMiddleware)

/**
 * GET /api/premium
 * Devuelve { premium: boolean } según userPlan del usuario (User = fuente de verdad).
 */
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('userPlan').lean()
    const premium = user?.userPlan === 'premium'
    return res.json({ premium })
  } catch (err) {
    console.error('GET /api/premium error:', err)
    return res.status(500).json({ error: 'Error al obtener premium' })
  }
})

/**
 * POST /api/premium/activate
 * Activa premium: actualiza userPlan a 'premium' en User y en State (compat).
 */
router.post('/activate', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $set: { userPlan: 'premium' } })
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
