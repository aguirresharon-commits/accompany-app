// Modal opcional al completar: "¿Dejás una nota?" → Listo / Omitir
import { useState, useRef, useEffect } from 'react'
import './NotePrompt.css'

const NotePrompt = ({ action, onConfirm, onSkip }) => {
  const [note, setNote] = useState('')
  const inputRef = useRef(null)
  const sheetRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Hacer scroll del input cuando recibe focus (para móviles)
  useEffect(() => {
    const input = inputRef.current
    const sheet = sheetRef.current
    if (!input || !sheet) return

    let viewportResizeHandler = null

    const handleFocus = () => {
      // Usar visualViewport si está disponible (móviles modernos)
      if (window.visualViewport) {
        const viewport = window.visualViewport
        viewportResizeHandler = () => {
          // Cuando el teclado se abre, el viewport se reduce
          if (viewport.height < window.innerHeight * 0.75) {
            // Scroll del input para que sea visible
            setTimeout(() => {
              input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
              // Asegurar que el sheet también haga scroll
              const inputRect = input.getBoundingClientRect()
              if (inputRect.bottom > viewport.height) {
                sheet.scrollTop += (inputRect.bottom - viewport.height) + 20
              }
            }, 100)
          }
        }
        viewport.addEventListener('resize', viewportResizeHandler)
        
        // También hacer scroll inmediato
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }, 300)
      } else {
        // Fallback para navegadores sin visualViewport
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }, 300)
      }
    }

    input.addEventListener('focus', handleFocus)

    return () => {
      input.removeEventListener('focus', handleFocus)
      if (window.visualViewport && viewportResizeHandler) {
        window.visualViewport.removeEventListener('resize', viewportResizeHandler)
      }
    }
  }, [])

  const handleConfirm = () => {
    onConfirm(note)
  }

  const handleSkip = () => {
    onSkip()
  }

  if (!action) return null

  return (
    <div className="note-prompt" role="dialog" aria-label="Nota opcional">
      <button type="button" className="note-prompt__backdrop" onClick={onSkip} aria-label="Cerrar" />
      <button
        type="button"
        className="note-prompt__back"
        onClick={onSkip}
        aria-label="Volver"
      >
        ←
      </button>
      <div ref={sheetRef} className="note-prompt__sheet">
        <p className="note-prompt__title">¿Dejás una nota? (opcional)</p>
        <textarea
          ref={inputRef}
          className="note-prompt__input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej.: Me costó pero salió."
          rows={2}
          maxLength={200}
          aria-label="Nota opcional"
        />
        <div className="note-prompt__actions">
          <button
            type="button"
            className="note-prompt__btn note-prompt__btn--skip"
            onClick={handleSkip}
          >
            Omitir
          </button>
          <button
            type="button"
            className="note-prompt__btn note-prompt__btn--confirm"
            onClick={handleConfirm}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotePrompt
