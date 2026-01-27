// Utilidades de sonido: sonidos sutiles generados con Web Audio API
// Sonidos muy cortos, suaves y opcionales para feedback calmado

let audioContext = null
let audioContextInitialized = false

const getAudioContext = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  
  // En móviles, el AudioContext puede estar suspendido y necesita interacción del usuario
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
    } catch (e) {
      // Si falla, intentar crear uno nuevo en la próxima interacción
      audioContext = null
      return null
    }
  }
  
  return audioContext
}

// Inicializar AudioContext en la primera interacción del usuario
export const initAudioContext = async () => {
  if (!audioContextInitialized) {
    try {
      await getAudioContext()
      audioContextInitialized = true
    } catch (e) {
      // Silenciar errores
    }
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

// Sonido de finalización de tiempo: calmado, no alarma
export const playTimerEndSound = async (enabled = true, volume = 0.3) => {
  if (!enabled) return
  
  try {
    const ctx = await getAudioContext()
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Frecuencia media, descendente suave
    oscillator.frequency.setValueAtTime(500, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2)
    
    // Volumen bajo con fade suave
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    
    oscillator.type = 'sine'
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.25)
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
