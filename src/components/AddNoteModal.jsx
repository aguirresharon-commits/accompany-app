// Modal "Agregar nota" (sesión/timer) sin marcar tarea completada
import { useState, useRef, useEffect } from 'react'
import BackButton from './BackButton'
import './AddNoteModal.css'

const AddNoteModal = ({ action, onConfirm, onSkip }) => {
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

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onSkip])

  const handleConfirm = () => {
    onConfirm(note)
  }

  if (!action) return null

  return (
    <div className="add-note-modal" role="dialog" aria-label="Agregar nota opcional" aria-modal="true">
      <button
        type="button"
        className="add-note-modal__backdrop"
        onClick={onSkip}
        aria-label="Cerrar"
      />
      <div ref={sheetRef} className="add-note-modal__sheet">
        <BackButton onClick={onSkip} />
        <p className="add-note-modal__title">¿Dejás una nota? (opcional)</p>
        <textarea
          ref={inputRef}
          className="add-note-modal__input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej.: Avancé un poco, voy a seguir después."
          rows={2}
          maxLength={200}
          aria-label="Nota opcional"
        />
        <div className="add-note-modal__actions">
          <button
            type="button"
            className="add-note-modal__btn add-note-modal__btn--skip"
            onClick={onSkip}
          >
            Omitir
          </button>
          <button
            type="button"
            className="add-note-modal__btn add-note-modal__btn--confirm"
            onClick={handleConfirm}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddNoteModal
