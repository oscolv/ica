import Papa from 'papaparse'
import type { GuidelineRow, GuidelineTable } from '../engine/types'
import { codeToRuleType } from './ruleTypeMap'
import { parseNumOrNull } from './num'

export interface ParseIssue {
  row: number
  parameterId: string
  message: string
}

export interface GuidelineParseResult {
  table: GuidelineTable
  issues: ParseIssue[]
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

export function parseGuidelinesCsv(csv: string): GuidelineParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  })
  const table: GuidelineTable = new Map()
  const issues: ParseIssue[] = []

  parsed.data.forEach((r, i) => {
    const parameterId = str(r.PARAMETER_ID)
    if (parameterId === '') return
    const rowNum = i + 2 // +1 por header, +1 por índice base 1

    const ruleType = codeToRuleType(str(r.EXCEED_IF))
    if (ruleType == null) {
      issues.push({
        row: rowNum,
        parameterId,
        message: `Código EXCEED_IF no soportado: "${str(r.EXCEED_IF)}".`,
      })
      return
    }

    const glRow: GuidelineRow = {
      parameterId,
      ruleType,
      lowerLimit: parseNumOrNull(r.LOWER_LIMIT),
      upperLimit: parseNumOrNull(r.UPPER_LIMIT),
      hardnessLower: parseNumOrNull(r.HARDNESS_LOWER),
      hardnessUpper: parseNumOrNull(r.HARDNESS_UPPER),
      seasonStart: str(r.SEASON_START) || null,
      seasonFinish: str(r.SEASON_FINISH) || null,
      unit: str(r.UNIT_ID) || undefined,
      source: str(r.GUIDELINE_SOURCE) || undefined,
    }

    const arr = table.get(parameterId) ?? []
    arr.push(glRow)
    table.set(parameterId, arr)
  })

  return { table, issues }
}
