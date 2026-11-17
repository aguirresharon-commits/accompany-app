import { useEffect, useRef } from 'react'
import './ControlSpark.css'

export default function ControlSpark({ state = 'idle', className = '' }) {
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
      <span ref={image} className="control-spark__portrait">
        <span className="control-spark__shadow" />
        <span className="control-spark__leg control-spark__leg--left" />
        <span className="control-spark__leg control-spark__leg--right" />
        <span className="control-spark__arm control-spark__arm--left" />
        <span className="control-spark__arm control-spark__arm--right" />
        <span className="control-spark__body" />
        <span className="control-spark__head">
          <span ref={gaze} className="control-spark__gaze">
            <i className="control-spark__eye" />
            <i className="control-spark__eye" />
          </span>
          <span className="control-spark__smile" />
        </span>
      </span>
      {state === 'done' && <span className="control-spark__particles"><i /><i /><i /></span>}
    </span>
  )
}
