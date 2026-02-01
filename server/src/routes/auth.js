import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Probá en un minuto.' }
})
router.use(authLimiter)

const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = 10
const JWT_EXPIRES = '7d'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(str) {
  return typeof str === 'string' && EMAIL_REGEX.test(str)
}

function createToken(userId) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET no definida')
  return jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

/**
 * POST /api/auth/register
 * Body: { email, password }
 * Devuelve: { user: { id, email }, token }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!emailTrim || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' })
    }
    if (!isValidEmail(emailTrim)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }
    const existing = await User.findOne({ email: emailTrim })
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' })
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({ email: emailTrim, password: hashed })
    const token = createToken(user._id)
    return res.status(201).json({
      user: { id: user._id.toString(), email: user.email },
      token
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Error al registrar' })
  }
})

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Devuelve: { user: { id, email }, token }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!emailTrim || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' })
    }
    if (!isValidEmail(emailTrim)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' })
    }
    const user = await User.findOne({ email: emailTrim }).select('+password')
    if (!user) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }
    const token = createToken(user._id)
    return res.json({
      user: { id: user._id.toString(), email: user.email },
      token
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

export default router
