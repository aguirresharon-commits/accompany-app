// Utilidades de sonido: sonidos sutiles generados con Web Audio API
// Sonidos muy cortos, suaves y opcionales para feedback calmado
// En móviles (iOS/Android) el audio debe desbloquearse en la primera interacción del usuario.

let audioContext = null

const getAudioContext = async () => {
  const createContext = () => {
    try {
      return new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      return null
    }
  }

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = createContext()
    if (!audioContext) return null
  }

  // En móviles el contexto suele empezar en 'suspended'; hace falta resume() dentro de un gesto.
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
    } catch (e) {
      return null
    }
  }

  // En iOS a veces el estado queda "running" pero no avanza; intentar suspend+resume una vez.
  if (audioContext.state === 'running') {
    return audioContext
  }
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.suspend()
      await audioContext.resume()
    } catch (e) {
      // ignorar
    }
  }

  return audioContext.state === 'running' ? audioContext : null
}

/**
 * Desbloquear audio en la primera interacción (tap/click).
 * Debe llamarse desde un manejador de touchend/click para que en móviles funcione.
 */
export const initAudioContext = async () => {
  try {
    const ctx = await getAudioContext()
    return !!(ctx && ctx.state === 'running')
  } catch (e) {
    return false
  }
}

// Sonido de confirmación: breve y suave
export const playCompleteSound = async (enabled = true, volume = 0.3) => {
  if (!enabled) return
  
  try {
    const ctx = await getAudioContext()
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Frecuencia suave y ascendente
    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
    
    // Volumen bajo y fade out rápido
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    
    oscillator.type = 'sine'
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  } catch (e) {
    // Silenciar errores de audio
  }
}

// Sonido de inicio: suave y calmado
export const playStartSound = async (enabled = true, volume = 0.25) => {
  if (!enabled) return
  
  try {
    const ctx = await getAudioContext()
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Frecuencia baja y suave
    oscillator.frequency.setValueAtTime(300, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.12)
    
    // Volumen muy bajo
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    
    oscillator.type = 'sine'
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.18)
  } catch (e) {
    // Silenciar errores de audio
  }
}

// Sonido de finalización de tiempo: suave aviso tipo “campanita”, no molesto
export const playTimerEndSound = async (enabled = true, volume = 0.3) => {
  if (!enabled) return

  try {
    const ctx = await getAudioContext()
    if (!ctx) return

    const vol = Math.min(1, Math.max(0, volume)) * 0.45
    const t0 = ctx.currentTime

    // Dos notas suaves (ding-dong) para avisar que terminó el tiempo
    const playNote = (freq, start, duration) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(freq, start)
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(vol, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
      osc.start(start)
      osc.stop(start + duration)
    }

    playNote(523, t0, 0.2)           // Do agudo, breve
    playNote(392, t0 + 0.18, 0.35)   // Sol, un poco más largo
  } catch (e) {
    // Silenciar errores de audio
  }
}

// Sonido mínimo para feedback de toque: muy breve
export const playTapSound = async (enabled = true, volume = 0.15) => {
  if (!enabled) return

  try {
    const ctx = await getAudioContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Frecuencia muy breve
    oscillator.frequency.setValueAtTime(200, ctx.currentTime)
    
    // Volumen muy bajo, muy breve
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    
    oscillator.type = 'sine'
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  } catch (e) {
    // Silenciar errores de audio
  }
}
