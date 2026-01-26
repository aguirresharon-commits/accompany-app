// Modal "Agregar nota" (sesión/timer) sin marcar tarea completada
import { useState, useRef, useEffect } from 'react'
import './AddNoteModal.css'

const AddNoteModal = ({ action, onConfirm, onSkip }) => {
  const [note, setNote] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
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
      <div className="add-note-modal__sheet">
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
