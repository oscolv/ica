import type { ProjectState } from './projectReducer'
import type { GuidelineTable, DataRow } from '../engine/types'

interface SerializedRow {
  station: string
  date: string | null
  values: Record<string, string>
}
interface SerializedProject {
  schemaVersion: 1
  guideline: [string, unknown][] | null
  guidelineName: string
  data: SerializedRow[] | null
  dataColumns: string[]
  dataName: string
}

export function serializeProject(state: ProjectState): string {
  const payload: SerializedProject = {
    schemaVersion: 1,
    guideline: state.guideline ? [...state.guideline.entries()] : null,
    guidelineName: state.guidelineName,
    data: state.data
      ? state.data.map((r) => ({
          station: r.station,
          date: r.date ? r.date.toISOString() : null,
          values: r.values,
        }))
      : null,
    dataColumns: state.dataColumns,
    dataName: state.dataName,
  }
  return JSON.stringify(payload)
}

export function deserializeProject(json: string): ProjectState {
  const o = JSON.parse(json) as SerializedProject
  const guideline: GuidelineTable | null = o.guideline
    ? new Map(o.guideline as [string, never][])
    : null
  const data: DataRow[] | null = o.data
    ? o.data.map((r) => ({ station: r.station, date: r.date ? new Date(r.date) : null, values: r.values }))
    : null
  return {
    guideline,
    guidelineName: o.guidelineName ?? '',
    data,
    dataColumns: o.dataColumns ?? [],
    dataName: o.dataName ?? '',
  }
}
