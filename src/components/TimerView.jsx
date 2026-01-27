// Pantalla durante la tarea: temporizador visible pero no intrusivo, sin distracciones
import { useState, useEffect, useCallback, useRef } from 'react'
import { playTimerEndSound, initAudioContext } from '../utils/sounds'
import './TimerView.css'

const pad = (n) => String(n).padStart(2, '0')

const TimerView = ({ action, seconds, onEnd, onStop, soundsEnabled, soundsVolume }) => {
  const [secondsLeft, setSecondsLeft] = useState(seconds)
  const intervalRef = useRef(null)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  const tick = useCallback(() => {
    setSecondsLeft((s) => {
      if (s <= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        // Inicializar y reproducir sonido de forma asíncrona
        initAudioContext().then(() => {
          playTimerEndSound(soundsEnabled, soundsVolume)
        }).catch(() => {
          // Silenciar errores
        })
        onEndRef.current?.()
        return 0
      }
      return s - 1
    })
  }, [soundsEnabled, soundsVolume])

  useEffect(() => {
    setSecondsLeft(seconds)
    intervalRef.current = setInterval(tick, 1000)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [seconds, tick])

  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60
  const display = `${pad(m)}:${pad(s)}`

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    onStop()
  }

  return (
    <div className="timer-view" role="timer" aria-label={`Temporizador: ${display} restantes`}>
      <div className="timer-view__inner">
        {action?.emoji && (
          <span className="timer-view__emoji" aria-hidden="true">{action.emoji}</span>
        )}
        <p className="timer-view__task">{action?.text}</p>
        <div className="timer-view__countdown" aria-live="polite">
          {display}
        </div>
        <p className="timer-view__hint">Podés parar cuando quieras.</p>
        <button
          type="button"
          className="timer-view__stop"
          onClick={handleStop}
          aria-label="Parar temporizador"
        >
          Parar
        </button>
      </div>
    </div>
  )
}

export default TimerView
