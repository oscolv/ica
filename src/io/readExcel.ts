import * as XLSX from 'xlsx'

/** Lee un workbook (.xlsx/.xls) y devuelve la PRIMERA hoja como CSV. */
export function workbookToCsv(data: ArrayBuffer | Uint8Array): string {
  const wb = XLSX.read(data, { type: 'array' })
  const first = wb.SheetNames[0]
  if (!first) return ''
  return XLSX.utils.sheet_to_csv(wb.Sheets[first])
}
