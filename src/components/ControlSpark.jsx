import { useEffect, useId, useRef } from 'react'
import portrait from '../assets/control-spark.webp'
import './ControlSpark.css'

export default function ControlSpark({ state = 'idle', className = '' }) {
  const gradient = useId()
  const image = useRef(null)
  const gaze = useRef(null)

  useEffect(() => {
    const eyes = gaze.current
    if (!eyes || state === 'running') return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timeout
    function reset() {
      eyes.style.removeProperty('--spark-gaze-x')
      eyes.style.removeProperty('--spark-gaze-y')
    }
    function follow(event) {
      if (reducedMotion.matches) return
      const bounds = image.current.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const x = Math.max(-3.5, Math.min(3.5, (event.clientX - bounds.left - bounds.width / 2) / 28))
      const y = Math.max(-2.5, Math.min(2.5, (event.clientY - bounds.top - bounds.height * .66) / 32))
      eyes.style.setProperty('--spark-gaze-x', `${x}px`)
      eyes.style.setProperty('--spark-gaze-y', `${y}px`)
      clearTimeout(timeout)
      timeout = setTimeout(reset, 850)
    }
    window.addEventListener('pointermove', follow, { passive: true })
    window.addEventListener('blur', reset)
    return () => {
      clearTimeout(timeout)
      reset()
      window.removeEventListener('pointermove', follow)
      window.removeEventListener('blur', reset)
    }
  }, [state])

  return (
    <span className={`control-spark ${className}`} data-state={state} aria-hidden="true">
      <span className="control-spark__ring" />
      <svg ref={image} className="control-spark__portrait" viewBox="398 365 113 121">
        <defs>
          <radialGradient id={gradient}>
            <stop offset=".62" stopColor="#202020" />
            <stop offset="1" stopColor="#202020" stopOpacity="0" />
          </radialGradient>
        </defs>
        <image href={portrait} x="398" y="365" width="113" height="121" />
        <g fill={`url(#${gradient})`}>
          <ellipse cx="464" cy="446" rx="7" ry="8" />
          <ellipse cx="478.5" cy="447" rx="6.5" ry="8" />
        </g>
        {state === 'done' ? (
          <path className="control-spark__smile" d="M440 448 Q445 440 450 448 M455 448 Q460 440 465 448"
            fill="none" stroke="#fff8eb" strokeWidth="2.6" strokeLinecap="round" />
        ) : (
          <g ref={gaze} className="control-spark__gaze" fill="#fff8eb">
            <ellipse className="control-spark__eye" cx="445" cy="446" rx="2.5" ry="4.6" />
            <ellipse className="control-spark__eye" cx="460" cy="446" rx="2.5" ry="4.6" />
          </g>
        )}
      </svg>
      {state === 'done' && <span className="control-spark__particles"><i /><i /><i /></span>}
    </span>
  )
}
