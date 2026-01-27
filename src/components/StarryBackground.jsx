// Fondo estrellas estilo Grok: parpadeo + movimiento muy lento. Solo en Welcome y ActionScreen.
import './StarryBackground.css'

const POSITIONS = [
  [7, 10], [24, 6], [38, 14], [72, 8], [91, 18], [12, 32], [86, 35], [4, 52], [48, 48], [78, 54],
  [15, 68], [62, 72], [30, 88], [82, 82], [52, 22], [34, 40], [68, 26], [8, 44], [94, 46], [58, 58],
  [18, 78], [44, 12], [88, 62], [2, 28], [56, 86], [74, 42], [22, 56], [96, 74], [40, 66], [66, 8],
  [10, 92], [80, 16], [50, 38], [28, 24], [92, 52],
]

const ANIM_CLASSES = ['starry-bg__star--anim', 'starry-bg__star--anim-2', 'starry-bg__star--anim-3']

export default function StarryBackground() {
  return (
    <div className="starry-bg" aria-hidden="true">
      <div className="starry-bg__shooting-star" aria-hidden="true" />
      {POSITIONS.map(([x, y], i) => {
        const sizeClass = i % 4 === 0 ? 'starry-bg__star--m' : 'starry-bg__star--s'
        const animClass = ANIM_CLASSES[i % 3]
        const delay = (i % 8) * 1.2
        return (
          <div
            key={`${x}-${y}-${i}`}
            className={`starry-bg__star ${sizeClass} ${animClass}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}
