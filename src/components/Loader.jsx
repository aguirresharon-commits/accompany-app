// Componente de carga con logo minimalista
import logoImage from '../assets/logo.png'
import './Loader.css'

const Loader = ({ isLoading }) => {
  if (!isLoading) {
    return null
  }

  return (
    <div className="loader-container">
      <div className="loader-inner">
        <img
          src={logoImage}
          alt="Control"
          className="loader-logo"
        />
        <span className="loader-spinner" aria-hidden="true" />
      </div>
    </div>
  )
}

export default Loader
