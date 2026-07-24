export interface ParsedValue {
  value: number | null
  nonDetect: boolean
}

export function parseValue(raw: string | null | undefined): ParsedValue {
  if (raw == null) return { value: null, nonDetect: false }
  let s = String(raw).trim()
  if (s === '') return { value: null, nonDetect: false }
  let nonDetect = false
  if (s[0] === '<' || s[0] === 'L') {
    nonDetect = true
    s = s.slice(1).trim()
  }
  const v = Number(s)
  return Number.isFinite(v) ? { value: v, nonDetect } : { value: null, nonDetect: false }
}
