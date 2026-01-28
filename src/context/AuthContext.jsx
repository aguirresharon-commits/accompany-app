// Contexto de autenticación: user, isAuthenticated, persistencia de sesión
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
} from 'firebase/auth'
import { auth, browserLocalPersistence } from '../config/firebase'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const isAuthenticated = !!user

  // Persistir sesión en el dispositivo (localStorage/IndexedDB vía Firebase)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email, password) => {
    await setPersistence(auth, browserLocalPersistence)
    const { user: u } = await signInWithEmailAndPassword(auth, email, password)
    return { uid: u.uid, email: u.email }
  }, [])

  const signUp = useCallback(async (email, password) => {
    await setPersistence(auth, browserLocalPersistence)
    const { user: u } = await createUserWithEmailAndPassword(auth, email, password)
    return { uid: u.uid, email: u.email }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
  }, [])

  const value = {
    user,
    isAuthenticated,
    authLoading,
    login,
    signUp,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}
