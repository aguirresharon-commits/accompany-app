// Modal opcional al completar: "¿Dejás una nota?" → Listo / Omitir
import { useState, useRef, useEffect } from 'react'
import './NotePrompt.css'

const NotePrompt = ({ action, onConfirm, onSkip }) => {
  const [note, setNote] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
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
      <div className="note-prompt__sheet">
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
