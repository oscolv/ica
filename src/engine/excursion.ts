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
    if (value < t) return { fail: true, excursion: t / value - 1 }
    return { fail: false, excursion: 0 }
  }
  // range
  const [lo, hi] = g.target as [number | null, number | null]
  if (lo != null && value < lo) return { fail: true, excursion: lo / value - 1 }
  if (hi != null && value > hi) return { fail: true, excursion: value / hi - 1 }
  return { fail: false, excursion: 0 }
}
