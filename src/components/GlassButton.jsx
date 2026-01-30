/**
 * Botón reutilizable con estilo glass/neón.
 * Glassmorphism, bordes redondeados, glow azul, animación suave al toque.
 * No cambia estructura ni lógica; solo aplica clase visual.
 */
import './GlassButton.css'

export default function GlassButton({
  className = '',
  children,
  active,
  disabled,
  type = 'button',
  ...props
}) {
  const classes = ['btn-glass', 'glass-button', className]
  if (active) classes.push('btn-glass--active')
  return (
    <button
      type={type}
      className={classes.filter(Boolean).join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
