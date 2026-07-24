import { AppShell } from './ui/AppShell'
import { GuiasModule } from './ui/guias/GuiasModule'
import { DatosModule } from './ui/datos/DatosModule'
import { ResultadosModule } from './ui/resultados/ResultadosModule'
import './App.css'

function App() {
  return (
    <AppShell
      steps={{
        guias: <GuiasModule />,
        datos: <DatosModule />,
        resultados: <ResultadosModule />,
      }}
    />
  )
}

export default App
