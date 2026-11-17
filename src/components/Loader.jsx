// Componente de carga con logo minimalista
import ControlSpark from './ControlSpark'
import './Loader.css'

const Loader = ({ isLoading }) => {
  if (!isLoading) {
    return null
  }

  return (
    <div className="loader-container" role="status" aria-label="Cargando Control">
      <div className="loader-inner">
        <ControlSpark className="loader-logo" />
        <span className="loader-spinner" aria-hidden="true" />
      </div>
    </div>
  )
}

export default Loader
