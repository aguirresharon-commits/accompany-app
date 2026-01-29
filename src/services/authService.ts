/**
 * Servicio de autenticación.
 * Centraliza el acceso a Firebase Auth y el manejo de sesión.
 * Usa la instancia auth de firebaseConfig.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '../firebaseConfig'

export type AuthUser = { uid: string; email: string | null }

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null
  return { uid: user.uid, email: user.email ?? null }
}

/**
 * Inicia sesión con email y contraseña.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return toAuthUser(result.user)!
}

/**
 * Inicia sesión o crea la cuenta si no existe (registro automático).
 * Solo para el flujo de activar Premium: el usuario ingresa email y contraseña;
 * si existe → login; si no existe → se crea la cuenta y queda logueado.
 */
export async function loginOrRegister(email: string, password: string): Promise<AuthUser> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return toAuthUser(result.user)!
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    const isNoAccount = code === 'auth/user-not-found' || code === 'auth/invalid-credential'
    if (!isNoAccount) throw err

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      return toAuthUser(result.user)!
    } catch (createErr: unknown) {
      const createCode = (createErr as { code?: string })?.code
      if (createCode === 'auth/email-already-in-use') throw err
      throw createErr
    }
  }
}

/**
 * Cierra la sesión del usuario.
 */
export async function logout(): Promise<void> {
  await signOut(auth)
}

/**
 * Devuelve el usuario actual (uid, email) o null si no hay sesión.
 */
export function getCurrentUser(): AuthUser | null {
  return toAuthUser(auth.currentUser)
}

/**
 * Wrapper de onAuthStateChanged. Ejecuta callback al cambiar el estado de auth.
 * Devuelve la función para cancelar la suscripción.
 */
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(toAuthUser(user))
  })
}
