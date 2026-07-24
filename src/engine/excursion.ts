import type { ResolvedGuideline } from './types'

export function evaluate(
  value: number,
  g: ResolvedGuideline,
): { fail: boolean; excursion: number } {
  if (g.mode === 'max') {
    const t = g.target as number
    if (value > t) return { fail: true, excursion: value / t - 1 }
    return { fail: false, excursion: 0 }
  }
  if (g.mode === 'min') {
    const t = g.target as number
    if (value < t) {
      // Un valor no positivo no admite razón de excursión (obj/value → ∞);
      // se marca como falla con amplitud 0 para no corromper el índice con NaN.
      return { fail: true, excursion: value > 0 ? t / value - 1 : 0 }
    }
    return { fail: false, excursion: 0 }
  }
  // range
  const [lo, hi] = g.target as [number | null, number | null]
  if (lo != null && value < lo) {
    return { fail: true, excursion: value > 0 ? lo / value - 1 : 0 }
  }
  if (hi != null && value > hi) return { fail: true, excursion: value / hi - 1 }
  return { fail: false, excursion: 0 }
}
