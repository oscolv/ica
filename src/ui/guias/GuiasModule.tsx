import { useState } from 'react'
import { useProject } from '../../state/ProjectContext'
import { GuidelineEntry } from './GuidelineEntry'
import { GuidelineTableEditor } from './GuidelineTableEditor'
import { ValidationPanel } from './ValidationPanel'
import { AddParameterForm } from './AddParameterForm'
import { serializeGuidelinesCsv } from '../../io/serializeGuidelines'
import './GuiasModule.css'

export function GuiasModule() {
  const { state, dispatch } = useProject()
  const [showAdd, setShowAdd] = useState(false)

  if (!state.guideline) return <GuidelineEntry />

  function download() {
    if (!state.guideline) return
    const csv = serializeGuidelinesCsv(state.guideline)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'guidelines.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <section className="guias">
      <div className="guias-bar">
        <h2>{state.guidelineName || 'Guía'}</h2>
        <div className="guias-actions">
          <button className="btn" onClick={() => setShowAdd((v) => !v)}>Agregar parámetro</button>
          <button className="btn" onClick={download}>Descargar CSV</button>
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'clear' })}>Cambiar guía</button>
        </div>
      </div>
      {showAdd && <AddParameterForm onDone={() => setShowAdd(false)} />}
      <ValidationPanel />
      <GuidelineTableEditor />
    </section>
  )
}
