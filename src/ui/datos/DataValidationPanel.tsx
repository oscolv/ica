import { useMemo } from 'react'
import { useProject } from '../../state/ProjectContext'
import { validateData } from '../../validation/validateData'
import { useStepNav } from '../stepNav'
import './DataValidationPanel.css'

export function DataValidationPanel() {
  const { state } = useProject()
  const goTo = useStepNav()
  const result = useMemo(() => {
    if (!state.data || !state.guideline) return null
    return validateData(state.data, state.dataColumns, state.guideline)
  }, [state.data, state.dataColumns, state.guideline])

  if (!state.data) return null
  if (!state.guideline) {
    return <div className="dvp-banner dvp-warnline">⚠ Carga una guía en el paso ① antes de validar los datos.</div>
  }
  if (!result) return null

  const errors = result.issues.filter((i) => i.severity === 'error')
  const warns = result.issues.filter((i) => i.severity === 'warn')

  return (
    <div className="dvp">
      <div className="dvp-summary">
        <span className="chip chip-ok">✓ {result.matched.length} emparejados</span>
        <span className="chip">◦ {result.dataWithoutGuideline.length} datos sin guía</span>
        <span className="chip">◦ {result.guidelineWithoutData.length} guías sin datos</span>
      </div>
      {errors.length > 0 && (
        <ul className="dvp-list dvp-errors">{errors.map((i, k) => <li key={`e${k}`}>✕ {i.message}</li>)}</ul>
      )}
      {warns.length > 0 && (
        <ul className="dvp-list dvp-warns">{warns.map((i, k) => <li key={`w${k}`}>⚠ {i.message}</li>)}</ul>
      )}
      {errors.length === 0 ? (
        <div className="dvp-banner dvp-ready">
          <span>✓ Listo para calcular el WQI.</span>
          {goTo && (
            <button className="btn btn-primary" onClick={() => goTo('resultados')}>Ir a Resultados ③</button>
          )}
        </div>
      ) : (
        <div className="dvp-banner dvp-blocked">Corrige los errores ✕ antes de calcular.</div>
      )}
    </div>
  )
}
