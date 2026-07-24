export function parseNumOrNull(s: string | null | undefined): number | null {
  if (s == null) return null
  const t = String(s).trim()
  if (t === '') return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}
