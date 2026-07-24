import type { GuidelineTable, GuidelineRow } from '../engine/types'

export interface ProjectState {
  guideline: GuidelineTable | null
  guidelineName: string
}

export type ProjectAction =
  | { type: 'loadGuideline'; table: GuidelineTable; name: string }
  | { type: 'setRow'; parameterId: string; index: number; patch: Partial<GuidelineRow> }
  | { type: 'addParameter'; row: GuidelineRow }
  | { type: 'removeParameter'; parameterId: string }
  | { type: 'clear' }

export const initialState: ProjectState = { guideline: null, guidelineName: '' }

/** Copia superficial de la tabla (Map nuevo con arrays nuevos) para inmutabilidad. */
function cloneTable(t: GuidelineTable): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const [k, rows] of t) m.set(k, rows.map((r) => ({ ...r })))
  return m
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'loadGuideline':
      return { guideline: cloneTable(action.table), guidelineName: action.name }
    case 'setRow': {
      if (!state.guideline) return state
      const t = cloneTable(state.guideline)
      const rows = t.get(action.parameterId)
      if (rows && rows[action.index]) {
        rows[action.index] = { ...rows[action.index], ...action.patch }
      }
      return { ...state, guideline: t }
    }
    case 'addParameter': {
      const t = state.guideline ? cloneTable(state.guideline) : new Map()
      const arr = t.get(action.row.parameterId) ?? []
      arr.push({ ...action.row })
      t.set(action.row.parameterId, arr)
      return { ...state, guideline: t }
    }
    case 'removeParameter': {
      if (!state.guideline) return state
      const t = cloneTable(state.guideline)
      t.delete(action.parameterId)
      return { ...state, guideline: t }
    }
    case 'clear':
      return initialState
    default:
      return state
  }
}
