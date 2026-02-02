import './loadEnv.js'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
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

const app = express()
const PORT = process.env.PORT ?? 4000
const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean)
const corsOrigin = origins.length === 1 ? origins[0] : origins

app.use(helmet())
app.use(cors({ origin: corsOrigin }))
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

async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start:', err.message)
    process.exit(1)
  }
}

start()
