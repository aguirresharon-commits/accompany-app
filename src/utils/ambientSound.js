/**
 * Sonido ambiental: reproducción en loop con fade-in vía Web Audio API,
 * activación/desactivación y persistencia en localStorage.
 * Usa el mismo AudioContext que el resto de la app (desbloqueado en el primer toque).
 */

import { getAudioContext } from './sounds'

const STORAGE_KEY = 'accompany-ambient-sound-enabled'
const VOLUME = 0.08
const FADE_DURATION = 1
const SOUND_PATH = '/sounds/ambient.mp3'

let audioBuffer = null
let sourceNode = null
let gainNode = null

/**
 * Lee si el sonido ambiental está habilitado (por defecto: true).
 */
export function getEnabled() {
  try {
    if (typeof window === 'undefined') return true
    const v = window.localStorage?.getItem(STORAGE_KEY)
    return v === null || v === '1'
  } catch {
    return true
  }
}

/**
 * Guarda la preferencia y actualiza reproducción.
 */
export function setEnabled(enabled) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
    }
  } catch (_) {}
  if (enabled) {
    play()
  } else {
    pause()
  }
}

function getAbsoluteSoundPath() {
  if (typeof window === 'undefined') return SOUND_PATH
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || ''
  return (base.replace(/\/$/, '') || '') + SOUND_PATH
}

/**
 * Carga y decodifica el MP3 (una sola vez).
 */
async function loadBuffer(ctx) {
  if (audioBuffer) return audioBuffer
  const url = getAbsoluteSoundPath()
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  const arrayBuffer = await res.arrayBuffer()
  audioBuffer = await ctx.decodeAudioData(arrayBuffer)
  return audioBuffer
}

/**
 * Reproduce el sonido con fade-in de 1 segundo (Web Audio API).
 */
export async function play() {
  if (!getEnabled()) return
  try {
    const ctx = await getAudioContext()
    if (!ctx) return
    const buffer = await loadBuffer(ctx)
    if (!buffer) return

    pause()

    gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + FADE_DURATION)
    gainNode.connect(ctx.destination)

    sourceNode = ctx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.loop = true
    sourceNode.connect(gainNode)
    sourceNode.start(0)
  } catch (e) {
    console.warn('[Ambient sound]', e?.message || e)
  }
}

/**
 * Pausa el sonido ambiental.
 */
export function pause() {
  if (sourceNode) {
    try {
      sourceNode.stop()
    } catch (_) {}
    sourceNode = null
  }
  gainNode = null
}

/**
 * Alterna entre activado y desactivado.
 */
export function toggle() {
  setEnabled(!getEnabled())
}

/**
 * Inicia el sonido si está habilitado. Debe llamarse después de initAudioContext()
 * (p. ej. en el callback del primer toque/clic).
 */
export function start() {
  if (getEnabled()) play()
}
