import mongoose from 'mongoose'

/**
 * Suscripción Premium por usuario (Mercado Pago Preapproval).
 * Fuente de verdad: status authorized + currentPeriodEnd > now = Premium activo.
 */
const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    mpSubscriptionId: {
      type: String,
      required: true,
      unique: true
    },
    planType: {
      type: String,
      enum: ['weekly', 'monthly', 'annual'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'paused', 'cancelled', 'past_due'],
      default: 'pending'
    },
    currentPeriodEnd: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
)

export default mongoose.model('Subscription', subscriptionSchema)
