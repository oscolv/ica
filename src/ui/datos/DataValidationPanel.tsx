import { useMemo } from 'react'
import { useProject } from '../../state/ProjectContext'
import { validateData } from '../../validation/validateData'
import './DataValidationPanel.css'

export function DataValidationPanel() {
  const { state } = useProject()
  const result = useMemo(() => {
    if (!state.data || !state.guideline) return null
    return validateData(state.data, state.dataColumns, state.guideline)
  }, [state.data, state.dataColumns, state.guideline])

  if (!state.data) return null
  if (!state.guideline) {
    return <p className="dvp-warn">🟡 Carga una guía en el paso ① antes de validar los datos.</p>
  }
  if (!result) return null

  const errors = result.issues.filter((i) => i.severity === 'error')
  const warns = result.issues.filter((i) => i.severity === 'warn')

  return (
    <div className="dvp">
      <div className="dvp-summary">
        <span>✅ {result.matched.length} emparejados</span>
        <span>◦ {result.dataWithoutGuideline.length} datos sin guía</span>
        <span>◦ {result.guidelineWithoutData.length} guías sin datos</span>
      </div>
      {errors.length > 0 && (
        <ul className="dvp-list dvp-errors">{errors.map((i, k) => <li key={`e${k}`}>🔴 {i.message}</li>)}</ul>
      )}
      {warns.length > 0 && (
        <ul className="dvp-list dvp-warns">{warns.map((i, k) => <li key={`w${k}`}>🟡 {i.message}</li>)}</ul>
      )}
      {errors.length === 0 ? (
        <p className="dvp-ready">✅ Listo para calcular el WQI.</p>
      ) : (
        <p className="dvp-blocked">Corrige los errores 🔴 antes de calcular.</p>
      )}
    </div>
  )
}
