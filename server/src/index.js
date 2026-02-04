import './loadEnv.js'
import http from 'http'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { connectDB, isConnected } from './config/db.js'
import { notFound, errorHandler } from './utils/errors.js'
import authRoutes from './routes/auth.js'
import stateRoutes from './routes/state.js'
import remindersRoutes from './routes/reminders.js'
import premiumRoutes from './routes/premium.js'

// Diagnóstico SMTP al arranque (solo para verificar que env está cargado)
const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const resetLinkBase = process.env.RESET_PASSWORD_LINK_BASE
console.log('[startup] SMTP env: SMTP_HOST=%s SMTP_PORT=%s SMTP_USER=%s SMTP_PASS=%s RESET_PASSWORD_LINK_BASE=%s',
  smtpHost ? smtpHost : '(no definido)',
  smtpPort !== undefined && smtpPort !== '' ? smtpPort : '(no definido)',
  smtpUser ? '(definido)' : '(no definido)',
  smtpPass ? '(definido)' : '(no definido)',
  resetLinkBase && String(resetLinkBase).trim() ? String(resetLinkBase).trim() : '(vacío)'
)

// Diagnóstico Google OAuth (puedes comentar o borrar este bloque cuando ya no lo necesites)
const port = process.env.PORT ?? 4000
const gClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const gClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
const gRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `http://localhost:${port}/api/auth/google/callback`
const gFrontendUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:3001'
console.log('[startup] Google OAuth: GOOGLE_CLIENT_ID=%s GOOGLE_CLIENT_SECRET=%s GOOGLE_REDIRECT_URI=%s FRONTEND_URL=%s',
  gClientId ? `${gClientId.slice(0, 20)}...` : '(no definido)',
  gClientSecret ? '(definido)' : '(no definido)',
  gRedirectUri,
  gFrontendUrl
)

const app = express()
const PORT = process.env.PORT ?? 4000
const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean)
const corsOrigin = origins.length === 1 ? origins[0] : origins

app.use(helmet())
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '256kb' }))

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Control API', health: '/health', api: '/api' })
})

app.get('/health', (req, res) => {
  const dbOk = isConnected()
  if (!dbOk) {
    return res.status(503).json({ ok: false, message: 'Control API', db: 'disconnected' })
  }
  res.json({ ok: true, message: 'Control API', db: 'connected' })
})

app.use('/api/auth', authRoutes)
app.use('/api/state', stateRoutes)
app.use('/api/reminders', remindersRoutes)
app.use('/api/premium', premiumRoutes)

app.use(notFound)
app.use(errorHandler)

function tryListen(port, onSuccess) {
  const server = http.createServer(app)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const fallback = port === 4001 ? 4000 : Number(port) + 1
      console.warn(`[startup] Puerto ${port} en uso. Usando http://localhost:${fallback} (cerrá el otro proceso o cambiá PORT en server/.env)`)
      console.warn(`[startup] Para Google OAuth, agregá en la consola de Google esta URI de redirección: http://localhost:${fallback}/api/auth/google/callback`)
      process.env.PORT = String(fallback)
      tryListen(fallback, onSuccess)
    } else {
      console.error('Failed to start:', err.message)
      process.exit(1)
    }
  })
  server.listen(port, () => {
    const actualPort = server.address().port
    if (actualPort !== port) process.env.PORT = String(actualPort)
    console.log(`Server running at http://localhost:${actualPort}`)
    onSuccess?.()
  })
}

async function start() {
  try {
    await connectDB()
    tryListen(PORT)
  } catch (err) {
    console.error('Failed to start:', err.message)
    process.exit(1)
  }
}

start()
