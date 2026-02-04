import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.warn('JWT_SECRET no está definida en .env')
}

/**
 * Middleware de auth: verifica JWT en cookie auth_token o Authorization: Bearer <token>.
 * Asigna req.userId (ObjectId del usuario).
 */
export function authMiddleware(req, res, next) {
  let token = req.cookies?.auth_token
  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7)
  }
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }
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
