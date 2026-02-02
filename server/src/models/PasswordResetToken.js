import mongoose from 'mongoose'
import crypto from 'crypto'

const RESET_EXPIRY_HOURS = 1

const passwordResetTokenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
)

passwordResetTokenSchema.index({ token: 1 }, { unique: true })
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export function createResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function getExpiresAt() {
  const d = new Date()
  d.setHours(d.getHours() + RESET_EXPIRY_HOURS)
  return d
}

export default mongoose.model('PasswordResetToken', passwordResetTokenSchema)
