/**
 * Utilidades para manejo de errores HTTP.
 */
export function sendError(res, status, message) {
  res.status(status).json({ error: message })
}

/**
 * Middleware 404: ruta no encontrada.
 */
export function notFound(req, res, next) {
  res.status(404).json({ error: 'No encontrado' })
}

/**
 * Middleware de errores global. Debe ir al final de las rutas.
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message ?? err)
  if (res.headersSent) return next(err)
  const status = err.status ?? err.statusCode ?? 500
  const message = err.message ?? 'Error interno del servidor'
  res.status(status).json({ error: message })
}
