import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.warn('JWT_SECRET no está definida en .env')
}

/**
 * Middleware de auth: verifica JWT en Authorization: Bearer <token>
 * y asigna req.userId (ObjectId del usuario).
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }
  const token = authHeader.slice(7)
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Configuración de auth incorrecta' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded.userId) {
      return res.status(401).json({ error: 'Token inválido' })
    }
    req.userId = decoded.userId
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}
