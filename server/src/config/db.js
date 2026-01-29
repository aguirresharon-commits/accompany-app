import mongoose from 'mongoose'

/**
 * Conexión a MongoDB.
 * URI desde MONGODB_URI en .env.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI no está definida en .env')
  }
  await mongoose.connect(uri)
  console.log('MongoDB connected')
}

export function isConnected() {
  return mongoose.connection.readyState === 1
}

export default { connectDB, isConnected }
