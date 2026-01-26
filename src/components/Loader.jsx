// Componente de carga con logo minimalista
import logoImage from '../assets/logo.png'
import './Loader.css'

const Loader = ({ isLoading }) => {
  if (!isLoading) {
    return null
  }

  return (
    <div className="loader-container">
      <img 
        src={logoImage} 
        alt="Control" 
        className="loader-logo"
      />
    </div>
  )
}

export default Loader
