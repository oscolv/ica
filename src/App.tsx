import { AppShell } from './ui/AppShell'
import { GuiasModule } from './ui/guias/GuiasModule'
import { DatosModule } from './ui/datos/DatosModule'
import './App.css'

function App() {
  return <AppShell steps={{ guias: <GuiasModule />, datos: <DatosModule /> }} />
}

export default App
