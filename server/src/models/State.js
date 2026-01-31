import mongoose from 'mongoose'

/**
 * Estado de la app por usuario (misma forma que control-app-state en el frontend).
 * Campos complejos (arrays/objetos) como Mixed para aceptar la estructura del cliente.
 */
const stateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    currentEnergyLevel: { type: String, default: null },
    completedActions: { type: mongoose.Schema.Types.Mixed, default: [] },
    allActions: { type: mongoose.Schema.Types.Mixed, default: [] },
    currentAction: { type: mongoose.Schema.Types.Mixed, default: null },
    streak: {
      type: {
        current: Number,
        lastDate: String,
        paused: Boolean
      },
      default: () => ({ current: 0, lastDate: null, paused: false })
    },
    history: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastResetDate: { type: String, default: '' },
    scheduledEnergyNextDay: { type: mongoose.Schema.Types.Mixed, default: null },
    sessionNotes: { type: mongoose.Schema.Types.Mixed, default: [] },
    sounds: {
      type: {
        enabled: Boolean,
        volume: Number
      },
      default: () => ({ enabled: true, volume: 0.3 })
    },
    userPlan: { type: String, enum: ['free', 'premium'], default: 'free' }
  },
  { timestamps: true }
)

export default mongoose.model('State', stateSchema)
