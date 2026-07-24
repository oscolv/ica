import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { workbookToCsv } from './readExcel'

describe('workbookToCsv', () => {
  it('convierte la primera hoja de un .xlsx a CSV', () => {
    // Construye un workbook en memoria con xlsx y lo escribe a buffer.
    const ws = XLSX.utils.aoa_to_sheet([
      ['Station', 'Date', 'DO'],
      ['S1', '2008-01-01', 7],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hoja1')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

    const csv = workbookToCsv(buf)
    expect(csv).toContain('Station')
    expect(csv).toContain('DO')
    expect(csv).toContain('S1')
  })
})
