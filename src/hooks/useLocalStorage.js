// Hook genérico para sincronizar estado con localStorage
import { useState, useEffect } from 'react'

export const useLocalStorage = (key, initialValue) => {
  // Estado inicial: intentar cargar desde localStorage o usar valor inicial
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error al leer localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Función para actualizar tanto el estado como localStorage
  const setValue = (value) => {
    try {
      // Permitir que value sea una función para mantener consistencia con useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Guardar en estado
      setStoredValue(valueToStore)
      
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error al guardar en localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
