import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB, isConnected } from './config/db.js'
import { notFound, errorHandler } from './utils/errors.js'
import authRoutes from './routes/auth.js'
import stateRoutes from './routes/state.js'
import remindersRoutes from './routes/reminders.js'
import premiumRoutes from './routes/premium.js'

const app = express()
const PORT = process.env.PORT ?? 4000
const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean)
const corsOrigin = origins.length === 1 ? origins[0] : origins

app.use(cors({ origin: corsOrigin }))
app.use(express.json())

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
