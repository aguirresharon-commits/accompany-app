/**
 * Crea un usuario de prueba con Premium activado.
 * Uso: npm run seed (desde server/)
 *
 * Credenciales: premium@test.com / PremiumTest1
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../src/config/db.js'
import User from '../src/models/User.js'
import State from '../src/models/State.js'

const TEST_EMAIL = 'premium@test.com'
const TEST_PASSWORD = 'PremiumTest1'
const SALT_ROUNDS = 10

async function seed() {
  try {
    await connectDB()

    let user = await User.findOne({ email: TEST_EMAIL }).select('+password')
    if (!user) {
      const hashed = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS)
      user = await User.create({ email: TEST_EMAIL, password: hashed })
      console.log('Usuario de prueba creado:', user.email)
    } else {
      console.log('Usuario de prueba ya existe:', user.email)
    }

    await State.findOneAndUpdate(
      { userId: user._id },
      { $set: { userPlan: 'premium', userId: user._id } },
      { upsert: true }
    )
    console.log('Premium activado para', user.email)

    console.log('')
    console.log('--- Usuario de prueba (Premium activado) ---')
    console.log('Email:    ', TEST_EMAIL)
    console.log('Password: ', TEST_PASSWORD)
    console.log('')
    console.log('Uso: POST /api/auth/login → Authorization: Bearer <token> en /api/state, /api/reminders, /api/premium')
    console.log('')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

seed()
