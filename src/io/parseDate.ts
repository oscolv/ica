const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/** Interpreta un año de 2 dígitos: 00–49 -> 2000s, 50–99 -> 1900s. */
function fullYear(y: number): number {
  if (y >= 100) return y
  return y <= 49 ? 2000 + y : 1900 + y
}

/** Construye un Date validando rango real (rechaza desbordes como 2007-02-30). */
function mk(year: number, monthIndex: number, day: number): Date | null {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null
  const d = new Date(year, monthIndex, day)
  if (d.getFullYear() !== year || d.getMonth() !== monthIndex || d.getDate() !== day) return null
  return d
}

export function parseFlexibleDate(s: string): Date | null {
  const t = s.trim()
  if (t === '') return null

  // YYYY-MM-DD
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return mk(Number(m[1]), Number(m[2]) - 1, Number(m[3]))

  // D-Mon-YY o D-Mon-YYYY
  m = t.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/)
  if (m) {
    const mon = MONTHS[m[2].toLowerCase()]
    if (mon === undefined) return null
    return mk(fullYear(Number(m[3])), mon, Number(m[1]))
  }

  // M/D/YYYY o M/D/YY
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) return mk(fullYear(Number(m[3])), Number(m[1]) - 1, Number(m[2]))

  return null
}
