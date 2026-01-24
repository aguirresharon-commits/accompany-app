import { AppProvider } from './context/AppContext'

function App() {
  return (
    <AppProvider>
      <div className="app">
        <h1>Acompañar</h1>
        <p>Sistema de estado y persistencia configurado</p>
      </div>
    </AppProvider>
  )
}

export default App
