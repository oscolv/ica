import { useState } from 'react'
import { useProject } from '../../state/ProjectContext'
import { PARAM_CATALOG, catalogToRow } from './paramCatalog'
import { RULE_LABELS } from './ruleLabels'
import type { RuleType, GuidelineRow } from '../../engine/types'
import './AddParameterForm.css'

const RULE_TYPES = Object.keys(RULE_LABELS) as RuleType[]

function numOrNull(v: string): number | null {
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function AddParameterForm({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useProject()
  const [parameterId, setParameterId] = useState('')
  const [ruleType, setRuleType] = useState<RuleType>('max')
  const [lower, setLower] = useState('')
  const [upper, setUpper] = useState('')
  const [unit, setUnit] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState<string | null>(null)

  function pickCatalog(id: string) {
    const e = PARAM_CATALOG.find((c) => c.id === id)
    if (!e) return
    setParameterId(e.parameterId)
    setRuleType(e.ruleType)
    setLower(e.lowerLimit == null ? '' : String(e.lowerLimit))
    setUpper(e.upperLimit == null ? '' : String(e.upperLimit))
    setUnit(e.unit)
    setSource(e.source)
    setError(null)
  }

  function submit() {
    const id = parameterId.trim()
    if (id === '') { setError('Escribe el nombre del parámetro.'); return }
    if (state.guideline?.has(id)) { setError(`El parámetro "${id}" ya existe en la guía.`); return }
    const lo = numOrNull(lower), up = numOrNull(upper)
    if (ruleType === 'max' && up == null) { setError('La regla de máximo requiere un límite superior.'); return }
    if (ruleType === 'min' && lo == null) { setError('La regla de mínimo requiere un límite inferior.'); return }
    if (ruleType === 'range' && lo == null && up == null) { setError('El rango requiere al menos un límite.'); return }

    const row: GuidelineRow = { parameterId: id, ruleType, lowerLimit: lo, upperLimit: up, unit: unit.trim() || undefined, source: source.trim() || undefined }
    dispatch({ type: 'addParameter', row })
    onDone()
  }

  return (
    <div className="apf">
      <div className="apf-row">
        <label>Del catálogo
          <select aria-label="Catálogo de parámetros" defaultValue="" onChange={(e) => pickCatalog(e.target.value)}>
            <option value="">— Personalizado —</option>
            {PARAM_CATALOG.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
      </div>
      <div className="apf-grid">
        <label>Parámetro
          <input value={parameterId} onChange={(e) => setParameterId(e.target.value)} placeholder="p. ej. BOD5_mgL" />
        </label>
        <label>Tipo de regla
          <select value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)}>
            {RULE_TYPES.map((rt) => <option key={rt} value={rt}>{RULE_LABELS[rt]}</option>)}
          </select>
        </label>
        <label>Límite inferior
          <input value={lower} inputMode="decimal" onChange={(e) => setLower(e.target.value)} />
        </label>
        <label>Límite superior
          <input value={upper} inputMode="decimal" onChange={(e) => setUpper(e.target.value)} />
        </label>
        <label>Unidad
          <input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </label>
        <label>Fuente
          <input value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
      </div>
      {error && <p className="apf-error" role="alert">{error}</p>}
      <div className="apf-actions">
        <button className="apf-btn" onClick={submit}>Agregar</button>
        <button className="apf-btn apf-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  )
}
