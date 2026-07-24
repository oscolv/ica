import { useProject } from '../../state/ProjectContext'
import { RULE_LABELS } from './ruleLabels'
import type { RuleType } from '../../engine/types'
import './GuidelineTableEditor.css'

const RULE_TYPES = Object.keys(RULE_LABELS) as RuleType[]

function numOrNull(v: string): number | null {
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function GuidelineTableEditor() {
  const { state, dispatch } = useProject()
  if (!state.guideline) return null
  const entries = [...state.guideline.entries()]

  if (entries.length === 0) {
    return <p className="gte-empty">La guía no tiene parámetros todavía.</p>
  }

  return (
    <div className="gte-wrap">
      <table className="gte">
        <thead>
          <tr>
            <th>Parámetro</th><th>Tipo de regla</th><th>Límite inf.</th>
            <th>Límite sup.</th><th>Unidad</th><th>Fuente</th><th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([paramId, rows]) =>
            rows.map((r, i) => (
              <tr key={`${paramId}-${i}`}>
                <td>
                  <input value={r.parameterId} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { parameterId: e.target.value } })} />
                </td>
                <td>
                  <select value={r.ruleType} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { ruleType: e.target.value as RuleType } })}>
                    {RULE_TYPES.map((rt) => <option key={rt} value={rt}>{RULE_LABELS[rt]}</option>)}
                  </select>
                </td>
                <td>
                  <input value={r.lowerLimit ?? ''} inputMode="decimal" onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { lowerLimit: numOrNull(e.target.value) } })} />
                </td>
                <td>
                  <input value={r.upperLimit ?? ''} inputMode="decimal" onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { upperLimit: numOrNull(e.target.value) } })} />
                </td>
                <td>
                  <input value={r.unit ?? ''} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { unit: e.target.value } })} />
                </td>
                <td>
                  <input value={r.source ?? ''} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { source: e.target.value } })} />
                </td>
                <td>
                  <button className="gte-del" aria-label={`Eliminar ${paramId}`} onClick={() => dispatch({ type: 'removeParameter', parameterId: paramId })}>✕</button>
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}
