import type { GuidelineTable, GuidelineRow } from '../engine/types'
import { ruleTypeToCode } from './ruleTypeMap'

const HEADER =
  'PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID'

function n(v: number | null | undefined): string {
  return v == null ? '' : String(v)
}
function s(v: string | null | undefined): string {
  const t = v == null ? '' : String(v)
  // Escapa comas/comillas envolviendo en comillas dobles.
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

function rowToCsv(r: GuidelineRow): string {
  return [
    s(r.parameterId),
    s(ruleTypeToCode(r.ruleType)),
    n(r.lowerLimit),
    n(r.upperLimit),
    n(r.hardnessLower),
    n(r.hardnessUpper),
    s(r.seasonStart),
    s(r.seasonFinish),
    s(r.source),
    s(r.unit),
  ].join(',')
}

export function serializeGuidelinesCsv(table: GuidelineTable): string {
  const lines = [HEADER]
  for (const rows of table.values()) {
    for (const r of rows) lines.push(rowToCsv(r))
  }
  return lines.join('\n') + '\n'
}
