import mongoose from 'mongoose'

/**
 * Recordatorio por usuario (misma forma que en remindersService del frontend).
 */
const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    id: {
      type: String,
      required: true
    },
    text: { type: String, default: '', trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    alarmEnabled: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    firedAt: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'hecho', 'pospuesto'], default: 'pending' },
    postponedUntil: { type: Date, default: null }
  },
  { timestamps: true }
)

reminderSchema.index({ userId: 1, id: 1 }, { unique: true })
reminderSchema.index({ userId: 1 })

export default mongoose.model('Reminder', reminderSchema)
