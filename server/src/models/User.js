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
      required: true,
      select: false
    }
  },
  { timestamps: true }
)

userSchema.index({ email: 1 }, { unique: true })

export default mongoose.model('User', userSchema)
