import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authMiddleware } from '../middleware/auth.js'
import PasswordResetToken, { createResetToken, getExpiresAt } from '../models/PasswordResetToken.js'
import { sendPasswordResetEmail } from '../utils/email.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Probá en un minuto.' }
})
router.use(authLimiter)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá en 15 minutos.' }
})

const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = 10
const JWT_EXPIRES = '7d'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8

function isValidEmail(str) {
  return typeof str === 'string' && EMAIL_REGEX.test(str)
}

function isPasswordSecure(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) return false
  return /[a-zA-Z]/.test(password) && /\d/.test(password)
}

function createToken(userId) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET no definida')
  return jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

/**
 * Configuración de Google OAuth.
 * GOOGLE_REDIRECT_URI se deriva del PORT si no está definida (mismo puerto que el servidor).
 * Devuelve { clientId, clientSecret, redirectUri, frontendUrl, missing } donde missing son las variables no definidas.
 */
function getGoogleOAuthConfig() {
  const port = process.env.PORT ?? 4000
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || null
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || null
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `http://localhost:${port}/api/auth/google/callback`
  const frontendUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:3001'
  const missing = []
  if (!clientId) missing.push('GOOGLE_CLIENT_ID')
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET')
  return { clientId, clientSecret, redirectUri, frontendUrl, missing }
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
    if (!isPasswordSecure(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una letra y un número' })
    }
    const existing = await User.findOne({ email: emailTrim })
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' })
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({ email: emailTrim, password: hashed, userPlan: 'free' })
    const token = createToken(user._id)
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    })
    return res.status(201).json({
      user: { id: user._id.toString(), email: user.email },
      userPlan: user.userPlan || 'free',
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
router.post('/login', loginLimiter, async (req, res) => {
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
    if (!user.password) {
      return res.status(401).json({ error: 'Esta cuenta usa Google. Iniciá sesión con Google.' })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }
    const token = createToken(user._id)
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    })
    return res.json({
      user: { id: user._id.toString(), email: user.email },
      userPlan: user.userPlan || 'free',
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
    if (!isPasswordSecure(newPassword)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una letra y un número' })
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

/**
 * GET /api/auth/google
 *
 * Paso 1 del flujo OAuth: redirige al usuario a la pantalla de login de Google.
 * Valida GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET; GOOGLE_REDIRECT_URI se deriva de PORT si no está definida.
 * Si faltan variables, redirige al frontend con ?error=... indicando cuáles faltan.
 */
router.get('/google', (req, res) => {
  const { clientId, clientSecret, redirectUri, frontendUrl, missing } = getGoogleOAuthConfig()

  if (missing.length > 0) {
    const msg = `Google OAuth no configurado. Faltan en server/.env: ${missing.join(', ')}.`
    console.error('[google]', msg)
    return res.redirect(`${frontendUrl}?error=${encodeURIComponent(msg)}`)
  }

  const state = crypto.randomBytes(32).toString('hex')
  const stateSigned = jwt.sign({ state }, JWT_SECRET || 'fallback', { expiresIn: '10m' })
  res.cookie('oauth_state', stateSigned, { httpOnly: true, sameSite: 'lax', maxAge: 600000, path: '/' })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state
  })
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  res.redirect(url)
})

/**
 * GET /api/auth/google/callback
 *
 * Paso 2 del flujo OAuth: Google redirige aquí con ?code=...&state=...
 *
 * 1. Valida el "state" (cookie) para evitar CSRF.
 * 2. Intercambia el code por tokens de Google (POST a oauth2.googleapis.com/token).
 * 3. Decodifica el id_token para obtener email y nombre.
 * 4. Busca el usuario por email en la base de datos:
 *    - Si existe: actualiza googleId/name si faltaban (vincula cuenta Google).
 *    - Si no existe: crea usuario nuevo (email, name, googleId, userPlan: 'free').
 * 5. Genera un JWT propio del backend (createToken).
 * 6. Responde:
 *    - Set-Cookie con el JWT (httpOnly) para requests desde el mismo origen.
 *    - Redirección al frontend con ?from=google#token=JWT&user=... para que el frontend
 *      guarde el token y redirija al home (útil cuando frontend y backend están en orígenes distintos).
 *
 * Manejo de errores: cualquier fallo redirige al frontend con ?error=mensaje (sin token).
 */
router.get('/google/callback', async (req, res) => {
  const { clientId, clientSecret, redirectUri, frontendUrl, missing } = getGoogleOAuthConfig()

  const redirectError = (msg) => {
    res.clearCookie('oauth_state', { path: '/' })
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(msg)}`)
  }

  if (missing.length > 0) {
    return redirectError(`Google OAuth no configurado. Faltan en server/.env: ${missing.join(', ')}.`)
  }

  const { code, state } = req.query
  const stateCookie = req.cookies?.oauth_state

  if (!code || !state) {
    return redirectError('Faltan parámetros de Google. Probá iniciar sesión de nuevo.')
  }

  let decoded
  try {
    decoded = jwt.verify(stateCookie, JWT_SECRET || 'fallback')
  } catch (_) {
    return redirectError('Estado de sesión inválido o expirado. Volvé a intentar.')
  }
  if (decoded.state !== state) {
    return redirectError('Estado no coincide. Volvé a intentar.')
  }

  let tokenRes
  try {
    tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })
  } catch (err) {
    console.error('[google/callback] Error de red al obtener tokens:', err.message)
    return redirectError('Error de conexión con Google. Probá de nuevo.')
  }

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error('[google/callback] token error:', tokenRes.status, errBody)
    return redirectError('Google no pudo verificar el inicio de sesión. Probá de nuevo.')
  }

  let tokens
  try {
    tokens = await tokenRes.json()
  } catch (_) {
    return redirectError('Respuesta de Google inválida.')
  }

  const idToken = tokens.id_token
  if (!idToken) return redirectError('Google no devolvió datos de sesión.')

  let payload
  try {
    payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString())
  } catch (_) {
    return redirectError('Datos de Google inválidos.')
  }

  const email = payload.email?.trim().toLowerCase()
  const name = payload.name || ''
  const sub = payload.sub

  if (!email) return redirectError('Google no proporcionó tu email.')

  let user
  try {
    user = await User.findOne({ email })
    if (user) {
      if (!user.googleId) {
        user.googleId = sub
        user.name = name || user.name
        await user.save()
      }
    } else {
      user = await User.create({
        email,
        name: name || undefined,
        googleId: sub,
        userPlan: 'free'
      })
    }
  } catch (err) {
    console.error('[google/callback] Error en base de datos:', err)
    return redirectError('Error al crear o actualizar tu cuenta. Probá de nuevo.')
  }

  const token = createToken(user._id)
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  })
  res.clearCookie('oauth_state', { path: '/' })

  const userPayload = { id: user._id.toString(), email: user.email }
  const tokenEnc = encodeURIComponent(token)
  const userEnc = encodeURIComponent(JSON.stringify(userPayload))
  const hash = `token=${tokenEnc}&user=${userEnc}`
  // Hash + query como fallback: algunos navegadores pierden el hash en redirects cross-origin
  const q = new URLSearchParams({ from: 'google', token, user: JSON.stringify(userPayload) })
  res.redirect(`${frontendUrl}?${q.toString()}#${hash}`)
})

/**
 * GET /api/auth/me
 * Devuelve el usuario actual si hay sesión válida (cookie o Bearer).
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password').lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    return res.json({
      user: { id: user._id.toString(), email: user.email },
      userPlan: user.userPlan || 'free'
    })
  } catch (err) {
    console.error('GET /me error:', err)
    return res.status(500).json({ error: 'Error al obtener usuario' })
  }
})

/**
 * POST /api/auth/logout
 * Limpia la cookie de sesión.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', { path: '/', httpOnly: true, sameSite: 'lax' })
  return res.status(200).json({ message: 'Sesión cerrada' })
})

/**
 * POST /api/auth/set-password
 * Autenticado con JWT. Crea contraseña interna (para usuarios que entraron por Google).
 * Body: { newPassword }
 */
router.post('/set-password', authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body
    if (!newPassword) {
      return res.status(400).json({ error: 'La contraseña es requerida' })
    }
    if (!isPasswordSecure(newPassword)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una letra y un número' })
    }
    const user = await User.findById(req.userId).select('+password')
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    if (user.password) {
      return res.status(400).json({ error: 'Ya tenés una contraseña. Usá "Olvidé mi contraseña" si la olvidaste.' })
    }
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
    user.password = hashed
    await user.save()
    return res.status(200).json({ message: 'Contraseña creada. Ahora podés iniciar sesión con email y contraseña.' })
  } catch (err) {
    console.error('Set-password error:', err)
    return res.status(500).json({ error: 'Error al crear contraseña' })
  }
})

export default router
