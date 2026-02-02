import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import PasswordResetToken, { createResetToken, getExpiresAt } from '../models/PasswordResetToken.js'
import { sendPasswordResetEmail } from '../utils/email.js'

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

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Siempre responde 200 para no revelar si el email existe.
 * Si hay SMTP configurado, envía email con link/código para restablecer.
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!emailTrim || !isValidEmail(emailTrim)) {
      return res.status(400).json({ error: 'Email inválido' })
    }
    const user = await User.findOne({ email: emailTrim })
    if (user) {
      const token = createResetToken()
      await PasswordResetToken.create({
        email: emailTrim,
        token,
        expiresAt: getExpiresAt()
      })
      console.log('[forgot-password] Usuario encontrado, enviando email a %s', emailTrim)
      const sent = await sendPasswordResetEmail(emailTrim, token)
      if (!sent) {
        console.warn('[forgot-password] email no enviado (revisar SMTP / RESET_PASSWORD_LINK_BASE). Ver logs [email] arriba.')
      } else {
        console.log('[forgot-password] Email enviado correctamente')
      }
    }
    return res.status(200).json({
      message: 'Si el email existe en nuestra base, recibirás instrucciones para restablecer la contraseña.'
    })
  } catch (err) {
    console.error('Forgot-password error:', err)
    return res.status(500).json({ error: 'Error al procesar la solicitud' })
  }
})

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    const tokenStr = typeof token === 'string' ? token.trim() : ''
    if (!tokenStr || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }
    const resetDoc = await PasswordResetToken.findOne({ token: tokenStr })
    if (!resetDoc || resetDoc.expiresAt < new Date()) {
      return res.status(400).json({ error: 'El enlace de restablecimiento es inválido o ha expirado' })
    }
    const user = await User.findOne({ email: resetDoc.email }).select('+password')
    if (!user) {
      return res.status(400).json({ error: 'El enlace de restablecimiento es inválido o ha expirado' })
    }
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
    user.password = hashed
    await user.save()
    await PasswordResetToken.deleteOne({ _id: resetDoc._id })
    return res.status(200).json({ message: 'Contraseña actualizada. Podés iniciar sesión.' })
  } catch (err) {
    console.error('Reset-password error:', err)
    return res.status(500).json({ error: 'Error al restablecer la contraseña' })
  }
})

export default router
