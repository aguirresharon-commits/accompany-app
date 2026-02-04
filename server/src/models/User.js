import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: false,
      select: false
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    name: {
      type: String,
      trim: true
    },
    userPlan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
