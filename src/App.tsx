import { AppShell } from './ui/AppShell'
import { GuiasModule } from './ui/guias/GuiasModule'
import './App.css'

function App() {
  return <AppShell steps={{ guias: <GuiasModule /> }} />
}

export default App
