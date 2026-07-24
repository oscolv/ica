import { useState, useEffect } from 'react'
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

function NumberCell({ value, onCommit }: { value: number | null; onCommit: (v: number | null) => void }) {
  const [text, setText] = useState(value == null ? '' : String(value))
  useEffect(() => {
    setText(value == null ? '' : String(value))
  }, [value])
  return (
    <input
      value={text}
      inputMode="decimal"
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(numOrNull(text))}
    />
  )
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
                  <NumberCell value={r.lowerLimit} onCommit={(v) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { lowerLimit: v } })} />
                </td>
                <td>
                  <NumberCell value={r.upperLimit} onCommit={(v) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { upperLimit: v } })} />
                </td>
                <td>
                  <input value={r.unit ?? ''} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { unit: e.target.value } })} />
                </td>
                <td>
                  <input value={r.source ?? ''} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { source: e.target.value } })} />
                </td>
                <td>
                  <button className="gte-del" aria-label={rows.length > 1 ? `Eliminar ${paramId} (fila ${i + 1})` : `Eliminar ${paramId}`} onClick={() => dispatch({ type: 'removeRow', parameterId: paramId, index: i })}>✕</button>
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}
