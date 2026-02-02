/**
 * Carga server/.env antes de que se importe cualquier módulo que use process.env
 * (p. ej. JWT_SECRET en auth). Debe ser el primer import en index.js.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })
