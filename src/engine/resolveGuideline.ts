import type { GuidelineRow, SampleContext, ResolvedGuideline } from './types'
import {
  cadmiumGuideline, copperGuideline, nickelGuideline,
  leadGuideline, zincGuideline, aluminumGuideline, ammoniaTotalGuideline,
} from './formulas'

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/** Interpreta "1-Jan" / "30-Apr" a {month (0-11), day}. */
export function monthDay(s: string): { month: number; day: number } | null {
  const m = s.trim().match(/^(\d{1,2})-([A-Za-z]{3})$/)
  if (!m) return null
  const month = MONTHS[m[2].toLowerCase()]
  if (month === undefined) return null
  return { month, day: Number(m[1]) }
}

function inSeason(date: Date, start: string, finish: string): boolean {
  const s = monthDay(start), f = monthDay(finish)
  if (!s || !f) return false
  const cur = date.getMonth() * 100 + date.getDate()
  const lo = s.month * 100 + s.day
  const hi = f.month * 100 + f.day
  return cur >= lo && cur <= hi
}

export function resolveGuideline(
  rows: GuidelineRow[],
  ctx: SampleContext,
): ResolvedGuideline | null {
  if (rows.length === 0) return null
  const kind = rows[0].ruleType

  switch (kind) {
    case 'max':
      return rows[0].upperLimit != null ? { target: rows[0].upperLimit, mode: 'max' } : null
    case 'min':
      return rows[0].lowerLimit != null ? { target: rows[0].lowerLimit, mode: 'min' } : null
    case 'range':
      if (rows[0].lowerLimit == null && rows[0].upperLimit == null) return null
      return { target: [rows[0].lowerLimit, rows[0].upperLimit], mode: 'range' }
    case 'alPh':
      return ctx.pH != null ? { target: aluminumGuideline(ctx.pH), mode: 'max' } : null
    case 'cdHardness':
      return ctx.hardness != null ? { target: cadmiumGuideline(ctx.hardness), mode: 'max' } : null
    case 'cuHardness':
      return ctx.hardness != null ? { target: copperGuideline(ctx.hardness), mode: 'max' } : null
    case 'niHardness':
      return ctx.hardness != null ? { target: nickelGuideline(ctx.hardness), mode: 'max' } : null
    case 'pbHardness':
      return ctx.hardness != null ? { target: leadGuideline(ctx.hardness), mode: 'max' } : null
    case 'znHardness':
      return ctx.hardness != null ? { target: zincGuideline(ctx.hardness), mode: 'max' } : null
    case 'ammonia': {
      if (ctx.pH == null || ctx.temp == null) return null
      const limit = rows[0].lowerLimit ?? rows[0].upperLimit
      if (limit == null) return null
      return { target: ammoniaTotalGuideline(limit, ctx.pH, ctx.temp), mode: 'max' }
    }
    case 'hardnessStep': {
      if (ctx.hardness == null) return null
      for (const r of rows) {
        const lo = r.hardnessLower ?? 0
        const hi = r.hardnessUpper
        if (ctx.hardness >= lo && (hi == null || ctx.hardness < hi)) {
          return r.upperLimit != null ? { target: r.upperLimit, mode: 'max' } : null
        }
      }
      return null
    }
    case 'season': {
      if (ctx.date == null) return null
      for (const r of rows) {
        if (r.seasonStart && r.seasonFinish && inSeason(ctx.date, r.seasonStart, r.seasonFinish)) {
          if (r.upperLimit != null) return { target: r.upperLimit, mode: 'max' }
          if (r.lowerLimit != null) return { target: r.lowerLimit, mode: 'min' }
          return null
        }
      }
      return null
    }
    default:
      return null
  }
}
