import { useProject } from '../../state/ProjectContext'
import { DataEntry } from './DataEntry'
import { DataPreview } from './DataPreview'
import { DataValidationPanel } from './DataValidationPanel'
import './DatosModule.css'

export function DatosModule() {
  const { state, dispatch } = useProject()

  if (!state.data) return <DataEntry />

  return (
    <section className="datos">
      <div className="datos-bar">
        <h2>{state.dataName || 'Datos'} · {state.data.length} filas</h2>
        <button className="dbtn-ghost" onClick={() => dispatch({ type: 'clearData' })}>Cambiar datos</button>
      </div>
      <DataValidationPanel />
      <DataPreview />
    </section>
  )
}
