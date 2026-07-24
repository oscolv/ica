# Fase 2 — IO, Presets y Validación · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir las capas de entrada/salida (parseo y serialización CSV/Excel de datos y guías), los presets (CCME + plantilla México) y la validación (de guías y cruzada de datos) como módulos TypeScript testeables, sobre el motor de la Fase 1.

**Architecture:** Tres carpetas nuevas. `src/io/` parsea CSV/Excel a las estructuras del motor (`DataRow[]`, `GuidelineTable`) y serializa de vuelta; puede usar librerías de I/O (Papa Parse, SheetJS). `src/presets/` contiene los conjuntos de guías como archivos CSV parseados por nuestro propio parser (garantiza consistencia). `src/validation/` valida guías y datos con funciones puras y mensajes en español. El motor `src/engine/` permanece intacto y puro.

**Tech Stack:** TypeScript, Vitest, Papa Parse (`papaparse`), SheetJS (`xlsx`).

## Global Constraints

- El motor `src/engine/` NO se modifica y permanece puro (sin I/O). Las capas nuevas lo consumen vía el barrel `src/engine/index.ts` (importan tipos con `import type` desde `../engine/types`).
- `src/io/` puede importar `papaparse` y `xlsx`. `src/validation/` es puro (sin librerías de I/O ni React). Ninguna capa importa React.
- **Sin variantes provinciales** (Manitoba/Alberta/BC): `codeToRuleType` devuelve `null` para códigos provinciales y el parser los registra como no soportados.
- `COMPUTE` mapea a la regla `ammonia` (hallazgo verificado del binario oficial: COMPUTE = amoníaco no ionizado).
- Los presets se representan como archivos CSV en formato oficial y se cargan con el parser propio (`parseGuidelinesCsv`), no como literales de objeto.
- Mensajes de validación en español.
- El emparejamiento de nombres parámetro↔columna es sensible a mayúsculas exactas (igual que el programa oficial); la validación reporta los que no empatan.

---

### Task 1: Dependencias + mapa de códigos de regla (`ruleTypeMap`)

**Files:**
- Modify: `package.json` (deps `papaparse`, `xlsx`; dev dep `@types/papaparse`)
- Create: `src/io/ruleTypeMap.ts`
- Test: `src/io/ruleTypeMap.test.ts`

**Interfaces:**
- Consumes: `RuleType` de `../engine/types`.
- Produces:
  - `codeToRuleType(code: string): RuleType | null` (case-insensitive; `null` si no reconocido o provincial).
  - `ruleTypeToCode(rt: RuleType): string` (código canónico oficial para serializar).

- [ ] **Step 1: Instalar dependencias**

Run: `npm install papaparse xlsx && npm install -D @types/papaparse`
Expected: se agregan a `package.json` sin errores.

- [ ] **Step 2: Escribir la prueba que falla (`src/io/ruleTypeMap.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { codeToRuleType, ruleTypeToCode } from './ruleTypeMap'

describe('codeToRuleType', () => {
  it('mapea códigos simples (case-insensitive)', () => {
    expect(codeToRuleType('>')).toBe('max')
    expect(codeToRuleType('<')).toBe('min')
    expect(codeToRuleType('<>')).toBe('range')
    expect(codeToRuleType('HARDNESS')).toBe('hardnessStep')
    expect(codeToRuleType('season')).toBe('season')
    expect(codeToRuleType('date')).toBe('season')
    expect(codeToRuleType('compute')).toBe('ammonia')
  })
  it('mapea fórmulas por dureza/pH en cualquier caja', () => {
    expect(codeToRuleType('pHDependCCME')).toBe('alPh')
    expect(codeToRuleType('CDHARDNESS')).toBe('cdHardness')
    expect(codeToRuleType('CuHardness')).toBe('cuHardness')
    expect(codeToRuleType('nihardness')).toBe('niHardness')
    expect(codeToRuleType('PbHardness')).toBe('pbHardness')
    expect(codeToRuleType('ZnHardness')).toBe('znHardness')
  })
  it('devuelve null para variantes provinciales y desconocidas', () => {
    expect(codeToRuleType('MB CdHardness')).toBeNull()
    expect(codeToRuleType('AB CdHardness')).toBeNull()
    expect(codeToRuleType('pHDependBC')).toBeNull()
    expect(codeToRuleType('MB pH dependant')).toBeNull()
    expect(codeToRuleType('loquesea')).toBeNull()
    expect(codeToRuleType('')).toBeNull()
  })
})

describe('ruleTypeToCode', () => {
  it('devuelve el código canónico oficial', () => {
    expect(ruleTypeToCode('max')).toBe('>')
    expect(ruleTypeToCode('min')).toBe('<')
    expect(ruleTypeToCode('range')).toBe('<>')
    expect(ruleTypeToCode('hardnessStep')).toBe('HARDNESS')
    expect(ruleTypeToCode('season')).toBe('SEASON')
    expect(ruleTypeToCode('ammonia')).toBe('COMPUTE')
    expect(ruleTypeToCode('alPh')).toBe('pHDependCCME')
    expect(ruleTypeToCode('cdHardness')).toBe('CdHardness')
    expect(ruleTypeToCode('cuHardness')).toBe('CuHardness')
    expect(ruleTypeToCode('niHardness')).toBe('NiHardness')
    expect(ruleTypeToCode('pbHardness')).toBe('PbHardness')
    expect(ruleTypeToCode('znHardness')).toBe('ZnHardness')
  })
})
```

- [ ] **Step 3: Correr la prueba y verificar que falla**

Run: `npm test -- src/io/ruleTypeMap.test.ts`
Expected: FAIL con "Cannot find module './ruleTypeMap'".

- [ ] **Step 4: Implementar `src/io/ruleTypeMap.ts`**

```ts
import type { RuleType } from '../engine/types'

// Códigos EXCEED_IF reconocidos (case-insensitive), mapeados a RuleType del motor.
// Las variantes provinciales (MB/AB/BC) NO se soportan y no aparecen aquí.
const CODE_TO_RULE: Record<string, RuleType> = {
  '>': 'max',
  '<': 'min',
  '<>': 'range',
  hardness: 'hardnessStep',
  season: 'season',
  date: 'season',
  compute: 'ammonia',
  phdependccme: 'alPh',
  cdhardness: 'cdHardness',
  cuhardness: 'cuHardness',
  nihardness: 'niHardness',
  pbhardness: 'pbHardness',
  znhardness: 'znHardness',
}

// Código canónico oficial por RuleType (para serializar).
const RULE_TO_CODE: Record<RuleType, string> = {
  max: '>',
  min: '<',
  range: '<>',
  hardnessStep: 'HARDNESS',
  season: 'SEASON',
  ammonia: 'COMPUTE',
  alPh: 'pHDependCCME',
  cdHardness: 'CdHardness',
  cuHardness: 'CuHardness',
  niHardness: 'NiHardness',
  pbHardness: 'PbHardness',
  znHardness: 'ZnHardness',
}

export function codeToRuleType(code: string): RuleType | null {
  const key = code.trim().toLowerCase()
  return CODE_TO_RULE[key] ?? null
}

export function ruleTypeToCode(rt: RuleType): string {
  return RULE_TO_CODE[rt]
}
```

- [ ] **Step 5: Correr la prueba y verificar que pasa**

Run: `npm test -- src/io/ruleTypeMap.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/io/ruleTypeMap.ts src/io/ruleTypeMap.test.ts
git commit -m "feat(io): dependencias de parseo y mapa de codigos EXCEED_IF <-> RuleType"
```

---

### Task 2: Parseo de guías (`parseGuidelinesCsv`)

**Files:**
- Create: `src/io/num.ts`
- Create: `src/io/parseGuidelines.ts`
- Test: `src/io/num.test.ts`
- Test: `src/io/parseGuidelines.test.ts`

**Interfaces:**
- Consumes: `GuidelineRow`, `GuidelineTable` de `../engine/types`; `codeToRuleType`.
- Produces:
  - `parseNumOrNull(s: string | null | undefined): number | null`
  - `parseGuidelinesCsv(csv: string): GuidelineParseResult` con
    `interface ParseIssue { row: number; parameterId: string; message: string }` y
    `interface GuidelineParseResult { table: GuidelineTable; issues: ParseIssue[] }`.

- [ ] **Step 1: Escribir la prueba que falla (`src/io/num.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { parseNumOrNull } from './num'

describe('parseNumOrNull', () => {
  it('convierte números', () => {
    expect(parseNumOrNull('0.05')).toBe(0.05)
    expect(parseNumOrNull(' 120 ')).toBe(120)
  })
  it('vacío/null/undefined/no-numérico -> null', () => {
    expect(parseNumOrNull('')).toBeNull()
    expect(parseNumOrNull(null)).toBeNull()
    expect(parseNumOrNull(undefined)).toBeNull()
    expect(parseNumOrNull('abc')).toBeNull()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/io/num.test.ts`
Expected: FAIL "Cannot find module './num'".

- [ ] **Step 3: Implementar `src/io/num.ts`**

```ts
export function parseNumOrNull(s: string | null | undefined): number | null {
  if (s == null) return null
  const t = String(s).trim()
  if (t === '') return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/io/num.test.ts`
Expected: PASS.

- [ ] **Step 5: Escribir la prueba que falla (`src/io/parseGuidelines.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { parseGuidelinesCsv } from './parseGuidelines'

const CSV = `PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID
ARSENIC_TOTAL_ugL,>,,5,,,,,CCME 1997,ug/L
DISSOLVED_OXYGEN_mgL,<,9.5,,,,,,CCME 1999,mg/L
PH,<>,6.5,9,,,,,CCME 1987,
LEAD_TOTAL_ugL,HARDNESS,,1,0,60,,,CCME 1987,ug/L
LEAD_TOTAL_ugL,HARDNESS,,7,180,,,,CCME 1987,ug/L
PHOSPHORUS_TOTAL_mgL,SEASON,,0.02,,,1-May,31-Oct,CCME 2004,mg/L
COPPER_TOTAL_ugL,CuHardness,,,,,,,CCME 1987,ug/L
WEIRD_PARAM,MB CdHardness,,,,,,,x,ug/L
`

describe('parseGuidelinesCsv', () => {
  it('agrupa filas por parámetro y mapea tipos de regla', () => {
    const { table } = parseGuidelinesCsv(CSV)
    expect(table.get('ARSENIC_TOTAL_ugL')![0].ruleType).toBe('max')
    expect(table.get('ARSENIC_TOTAL_ugL')![0].upperLimit).toBe(5)
    expect(table.get('DISSOLVED_OXYGEN_mgL')![0].ruleType).toBe('min')
    expect(table.get('DISSOLVED_OXYGEN_mgL')![0].lowerLimit).toBe(9.5)
    expect(table.get('PH')![0].ruleType).toBe('range')
    expect(table.get('COPPER_TOTAL_ugL')![0].ruleType).toBe('cuHardness')
  })
  it('agrupa las dos filas de plomo (escalones) bajo el mismo parámetro', () => {
    const { table } = parseGuidelinesCsv(CSV)
    const pb = table.get('LEAD_TOTAL_ugL')!
    expect(pb).toHaveLength(2)
    expect(pb[0].hardnessLower).toBe(0)
    expect(pb[0].hardnessUpper).toBe(60)
    expect(pb[1].hardnessLower).toBe(180)
    expect(pb[1].hardnessUpper).toBeNull()
  })
  it('conserva ventanas de estación', () => {
    const { table } = parseGuidelinesCsv(CSV)
    const p = table.get('PHOSPHORUS_TOTAL_mgL')![0]
    expect(p.ruleType).toBe('season')
    expect(p.seasonStart).toBe('1-May')
    expect(p.seasonFinish).toBe('31-Oct')
    expect(p.upperLimit).toBe(0.02)
  })
  it('registra un issue y omite parámetros con código no soportado', () => {
    const { table, issues } = parseGuidelinesCsv(CSV)
    expect(table.has('WEIRD_PARAM')).toBe(false)
    expect(issues.some((i) => i.parameterId === 'WEIRD_PARAM')).toBe(true)
  })
})
```

- [ ] **Step 6: Correr y verificar que falla**

Run: `npm test -- src/io/parseGuidelines.test.ts`
Expected: FAIL "Cannot find module './parseGuidelines'".

- [ ] **Step 7: Implementar `src/io/parseGuidelines.ts`**

```ts
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
```

- [ ] **Step 8: Correr y verificar que pasa**

Run: `npm test -- src/io/parseGuidelines.test.ts`
Expected: PASS (4 pruebas).

- [ ] **Step 9: Commit**

```bash
git add src/io/num.ts src/io/num.test.ts src/io/parseGuidelines.ts src/io/parseGuidelines.test.ts
git commit -m "feat(io): parseNumOrNull y parseGuidelinesCsv (agrupa por parametro, mapea reglas)"
```

---

### Task 3: Parseo de datos (`parseDataCsv`) + fechas flexibles

**Files:**
- Create: `src/io/parseDate.ts`
- Create: `src/io/parseData.ts`
- Test: `src/io/parseDate.test.ts`
- Test: `src/io/parseData.test.ts`

**Interfaces:**
- Consumes: `DataRow` de `../engine/types`.
- Produces:
  - `parseFlexibleDate(s: string): Date | null` (soporta `M/D/YYYY`, `D-Mon-YY`, `YYYY-MM-DD`).
  - `parseDataCsv(csv: string, opts?: { stationCol?: string; dateCol?: string }): DataParseResult` con
    `interface DataParseResult { rows: DataRow[]; columns: string[]; issues: { row: number; message: string }[] }`.
    `columns` = nombres de columnas de parámetros (todas menos estación y fecha).

- [ ] **Step 1: Escribir la prueba que falla (`src/io/parseDate.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { parseFlexibleDate } from './parseDate'

describe('parseFlexibleDate', () => {
  it('M/D/YYYY', () => {
    const d = parseFlexibleDate('5/6/2007')!
    expect(d.getFullYear()).toBe(2007)
    expect(d.getMonth()).toBe(4) // mayo
    expect(d.getDate()).toBe(6)
  })
  it('D-Mon-YY', () => {
    const d = parseFlexibleDate('7-Jan-97')!
    expect(d.getFullYear()).toBe(1997)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(7)
  })
  it('YYYY-MM-DD', () => {
    const d = parseFlexibleDate('2008-04-04')!
    expect(d.getFullYear()).toBe(2008)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(4)
  })
  it('inválida -> null', () => {
    expect(parseFlexibleDate('no-es-fecha')).toBeNull()
    expect(parseFlexibleDate('')).toBeNull()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/io/parseDate.test.ts`
Expected: FAIL "Cannot find module './parseDate'".

- [ ] **Step 3: Implementar `src/io/parseDate.ts`**

```ts
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/** Interpreta un año de 2 dígitos: 00–49 -> 2000s, 50–99 -> 1900s. */
function fullYear(y: number): number {
  if (y >= 100) return y
  return y <= 49 ? 2000 + y : 1900 + y
}

export function parseFlexibleDate(s: string): Date | null {
  const t = s.trim()
  if (t === '') return null

  // YYYY-MM-DD
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))

  // D-Mon-YY o D-Mon-YYYY
  m = t.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/)
  if (m) {
    const mon = MONTHS[m[2].toLowerCase()]
    if (mon === undefined) return null
    return new Date(fullYear(Number(m[3])), mon, Number(m[1]))
  }

  // M/D/YYYY o M/D/YY
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) return new Date(fullYear(Number(m[3])), Number(m[1]) - 1, Number(m[2]))

  return null
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/io/parseDate.test.ts`
Expected: PASS.

- [ ] **Step 5: Escribir la prueba que falla (`src/io/parseData.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { parseDataCsv } from './parseData'

const CSV = `Station,Date,DO,TP
S1,5/6/2007,6,0.10
S1,7/25/2007,<0.5,0.02
`

describe('parseDataCsv', () => {
  it('extrae filas, estación, fecha y columnas de parámetros', () => {
    const { rows, columns } = parseDataCsv(CSV)
    expect(columns).toEqual(['DO', 'TP'])
    expect(rows).toHaveLength(2)
    expect(rows[0].station).toBe('S1')
    expect(rows[0].date!.getFullYear()).toBe(2007)
    expect(rows[0].values).toEqual({ DO: '6', TP: '0.10' })
    expect(rows[1].values.DO).toBe('<0.5') // conserva el crudo del no-detectado
  })
  it('reconoce Station/Date sin importar mayúsculas', () => {
    const csv = `STATION,DATE,DO\nA,2008-01-01,7\n`
    const { rows, columns } = parseDataCsv(csv)
    expect(columns).toEqual(['DO'])
    expect(rows[0].station).toBe('A')
    expect(rows[0].date!.getMonth()).toBe(0)
  })
  it('registra issue si falta la columna Station o Date', () => {
    const csv = `Foo,Date,DO\nA,2008-01-01,7\n`
    const { issues } = parseDataCsv(csv)
    expect(issues.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 6: Correr y verificar que falla**

Run: `npm test -- src/io/parseData.test.ts`
Expected: FAIL "Cannot find module './parseData'".

- [ ] **Step 7: Implementar `src/io/parseData.ts`**

```ts
import Papa from 'papaparse'
import type { DataRow } from '../engine/types'
import { parseFlexibleDate } from './parseDate'

export interface DataParseResult {
  rows: DataRow[]
  columns: string[]
  issues: { row: number; message: string }[]
}

function findCol(headers: string[], preferred: string, fallbacks: string[]): string | null {
  const wanted = [preferred, ...fallbacks].map((w) => w.toLowerCase())
  for (const h of headers) {
    if (wanted.includes(h.trim().toLowerCase())) return h
  }
  return null
}

export function parseDataCsv(
  csv: string,
  opts: { stationCol?: string; dateCol?: string } = {},
): DataParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  })
  const headers = parsed.meta.fields ?? []
  const issues: { row: number; message: string }[] = []

  const stationCol = opts.stationCol ?? findCol(headers, 'Station', ['Estacion', 'Estación', 'Sitio'])
  const dateCol = opts.dateCol ?? findCol(headers, 'Date', ['Fecha'])

  if (!stationCol) issues.push({ row: 1, message: 'No se encontró la columna de estación (Station).' })
  if (!dateCol) issues.push({ row: 1, message: 'No se encontró la columna de fecha (Date).' })

  const columns = headers.filter((h) => h !== stationCol && h !== dateCol)

  const rows: DataRow[] = []
  parsed.data.forEach((r, i) => {
    const station = stationCol ? String(r[stationCol] ?? '').trim() : ''
    const dateRaw = dateCol ? String(r[dateCol] ?? '').trim() : ''
    const date = dateRaw ? parseFlexibleDate(dateRaw) : null
    const values: Record<string, string> = {}
    for (const c of columns) values[c] = String(r[c] ?? '').trim()
    rows.push({ station, date, values })
    if (dateCol && dateRaw && date == null) {
      issues.push({ row: i + 2, message: `Fecha no reconocida: "${dateRaw}".` })
    }
  })

  return { rows, columns, issues }
}
```

- [ ] **Step 8: Correr y verificar que pasa**

Run: `npm test -- src/io/parseData.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 9: Commit**

```bash
git add src/io/parseDate.ts src/io/parseDate.test.ts src/io/parseData.ts src/io/parseData.test.ts
git commit -m "feat(io): parseFlexibleDate y parseDataCsv (formato ancho, no-detectados crudos)"
```

---

### Task 4: Lectura de Excel (`workbookToCsv`)

**Files:**
- Create: `src/io/readExcel.ts`
- Test: `src/io/readExcel.test.ts`

**Interfaces:**
- Consumes: `xlsx`.
- Produces: `workbookToCsv(data: ArrayBuffer | Uint8Array): string` (primera hoja → CSV, para alimentar `parseDataCsv`/`parseGuidelinesCsv`).

- [ ] **Step 1: Escribir la prueba que falla (`src/io/readExcel.test.ts`)**

```ts
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
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/io/readExcel.test.ts`
Expected: FAIL "Cannot find module './readExcel'".

- [ ] **Step 3: Implementar `src/io/readExcel.ts`**

```ts
import * as XLSX from 'xlsx'

/** Lee un workbook (.xlsx/.xls) y devuelve la PRIMERA hoja como CSV. */
export function workbookToCsv(data: ArrayBuffer | Uint8Array): string {
  const wb = XLSX.read(data, { type: 'array' })
  const first = wb.SheetNames[0]
  if (!first) return ''
  return XLSX.utils.sheet_to_csv(wb.Sheets[first])
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/io/readExcel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/io/readExcel.ts src/io/readExcel.test.ts
git commit -m "feat(io): workbookToCsv (primera hoja de Excel a CSV)"
```

---

### Task 5: Serialización de guías (`serializeGuidelinesCsv`)

**Files:**
- Create: `src/io/serializeGuidelines.ts`
- Test: `src/io/serializeGuidelines.test.ts`

**Interfaces:**
- Consumes: `GuidelineTable` de `../engine/types`; `ruleTypeToCode`; `parseGuidelinesCsv` (para el round-trip en la prueba).
- Produces: `serializeGuidelinesCsv(table: GuidelineTable): string` (encabezado oficial + una fila por `GuidelineRow`).

- [ ] **Step 1: Escribir la prueba que falla (`src/io/serializeGuidelines.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { serializeGuidelinesCsv } from './serializeGuidelines'
import { parseGuidelinesCsv } from './parseGuidelines'

const CSV = `PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID
ARSENIC_TOTAL_ugL,>,,5,,,,,CCME 1997,ug/L
PH,<>,6.5,9,,,,,CCME 1987,
LEAD_TOTAL_ugL,HARDNESS,,1,0,60,,,CCME 1987,ug/L
LEAD_TOTAL_ugL,HARDNESS,,7,180,,,,CCME 1987,ug/L
`

describe('serializeGuidelinesCsv', () => {
  it('round-trip: parsear -> serializar -> parsear conserva la tabla', () => {
    const { table } = parseGuidelinesCsv(CSV)
    const out = serializeGuidelinesCsv(table)
    const { table: table2, issues } = parseGuidelinesCsv(out)
    expect(issues).toHaveLength(0)
    expect(table2.get('ARSENIC_TOTAL_ugL')![0].upperLimit).toBe(5)
    expect(table2.get('ARSENIC_TOTAL_ugL')![0].ruleType).toBe('max')
    expect(table2.get('PH')![0].ruleType).toBe('range')
    expect(table2.get('LEAD_TOTAL_ugL')).toHaveLength(2)
    expect(table2.get('LEAD_TOTAL_ugL')![1].hardnessLower).toBe(180)
  })
  it('la primera línea es el encabezado oficial', () => {
    const { table } = parseGuidelinesCsv(CSV)
    const out = serializeGuidelinesCsv(table)
    expect(out.split('\n')[0]).toBe(
      'PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID',
    )
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/io/serializeGuidelines.test.ts`
Expected: FAIL "Cannot find module './serializeGuidelines'".

- [ ] **Step 3: Implementar `src/io/serializeGuidelines.ts`**

```ts
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
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/io/serializeGuidelines.test.ts`
Expected: PASS (2 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/io/serializeGuidelines.ts src/io/serializeGuidelines.test.ts
git commit -m "feat(io): serializeGuidelinesCsv con round-trip a formato oficial"
```

---

### Task 6: Presets (CCME + plantilla México)

**Files:**
- Create: `src/presets/ccme.csv`
- Create: `src/presets/mexico.csv`
- Create: `src/presets/index.ts`
- Create: `src/vite-env.d.ts` (si no existe ya; declara imports `?raw`)
- Test: `src/presets/presets.test.ts`

**Interfaces:**
- Consumes: `parseGuidelinesCsv`, `validateGuidelines` (nota: `validateGuidelines` se crea en Task 7; esta prueba NO lo usa, solo usa `parseGuidelinesCsv`), `GuidelineTable`.
- Produces:
  - `interface Preset { id: string; name: string; description: string; table: GuidelineTable }`
  - `PRESETS: Preset[]`
  - `getPreset(id: string): Preset | undefined`

- [ ] **Step 1: Crear `src/presets/ccme.csv`**

Copia el contenido de `reference/Guidelines.csv` (el set CCME de vida acuática validado), con DOS correcciones de higiene: (a) en la fila del hierro `IRON_TOTAL_mgL` cambia `UNIT_ID` de `ug/L` a `mg/L` (el límite 0.3 está en mg/L); (b) en la fila del talio `THALLIUM_TOTAL_ugL` corrige el `UNIT_ID` a `ug/L` en UTF-8 limpio. Encabezado idéntico al oficial. Contenido exacto a escribir:

```csv
PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID
ALUMINUM_TOTAL_mgL,pHDependCCME,,,,,,,CCME 1987,mg/L
AMMONIA_TOTAL_mgL_N,COMPUTE,0.0152,,,,,,CCME 2001,mg/L as N
AMMONIA_UNIONIZED_mgL_N,>,,0.0152,,,,,CCME 2001,mg/L as N
ARSENIC_TOTAL_ugL,>,,5,,,,,CCME 1997,ug/L
CADMIUM_TOTALugL,CDHARDNESS,,,,,,,CCME 1996,ug/L
CHLORIDE_mgL,>,,120,,,,,CCME 2011,mg/L
CHROMIUM_III_ugL,>,,8.9,,,,,CCME 1997,ug/L
CHROMIUM_VI_ugL,>,,1,,,,,CCME 1997,ug/L
COPPER_TOTAL_ugL,CUHARDNESS,,,,,,,CCME 1987,ug/L
DISSOLVED_OXYGEN_mgL,<,9.5,,,,,,CCME 1999,mg/L
IRON_TOTAL_mgL,>,,0.3,,,,,CCME 1987,mg/L
LEAD_TOTAL_ugL,HARDNESS,,1,0,60,,,CCME 1987,ug/L
LEAD_TOTAL_ugL,HARDNESS,,2,60,120,,,CCME 1987,ug/L
LEAD_TOTAL_ugL,HARDNESS,,4,120,180,,,CCME 1987,ug/L
LEAD_TOTAL_ugL,HARDNESS,,7,180,,,,CCME 1987,ug/L
INORGANIC_MERCURY_ugL,>,,0.026,,,,,CCME 2003,ug/L
METHYLMERCURY_ugL,>,,0.004,,,,,CCME 2003,ug/L
MOLYBDENUM_TOTAL_ugL,>,,73,,,,,CCME 1999,ug/L
NICKEL_TOTAL_ugL,NIHARDNESS,,,,,,,CCME 1987,ug/L
NITRATE_TOTAL_mgLasN,>,,13,,,,,CCME 2012,mg/L
NITRITE_TOTAL_mgLasN,>,,0.06,,,,,CCME 1987,mg/L
PH,<>,6.5,9,,,,,CCME 1987,
PHOSPHORUS_TOTAL_mgL,SEASON,,0.03,,,1-Jan,30-Apr,CCME 2004,mg/L
PHOSPHORUS_TOTAL_mgL,SEASON,,0.02,,,1-May,31-Oct,CCME 2004,mg/L
PHOSPHORUS_TOTAL_mgL,SEASON,,0.03,,,1-Nov,31-Dec,CCME 2004,mg/L
SELENIUM_TOTAL_ugL,>,,1,,,,,CCME 1987,ug/L
SILVER_TOTAL_ugL,>,,0.1,,,,,CCME 1987,ug/L
THALLIUM_TOTAL_ugL,>,,0.8,,,,,CCME 1999,ug/L
TURBIDITY_NTU,SEASON,,5,,,1-Jan,30-Apr,CCME 1999,NTU
TURBIDITY_NTU,SEASON,,10,,,1-May,31-Oct,CCME 1999,NTU
TURBIDITY_NTU,SEASON,,5,,,1-Nov,31-Dec,CCME 1999,NTU
URANIUM_TOTAL_ugL,>,,15,,,,,CCME 2011,ug/L
ZINC_TOTAL_ugL,>,,30,,,,,CCME 1987,ug/L
```

- [ ] **Step 2: Crear `src/presets/mexico.csv`**

Plantilla México PROVISIONAL (valores de referencia a verificar contra la norma vigente: NOM-127-SSA1-2021 para uso/consumo humano, CE-CCA-001/89 y NOM-001-SEMARNAT-2021 para criterios ecológicos, y OMS). Incluye los parámetros generales y microbiológicos típicos del monitoreo mexicano. Contenido exacto a escribir:

```csv
PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID
PH,<>,6.5,8.5,,,,,NOM-127-SSA1-2021 (provisional),
DISSOLVED_OXYGEN_mgL,<,5,,,,,,CE-CCA-001/89 (provisional),mg/L
BOD5_mgL,>,,30,,,,,NOM-001-SEMARNAT-2021 (provisional),mg/L
COD_mgL,>,,40,,,,,Referencia general (provisional),mg/L
TOTAL_DISSOLVED_SOLIDS_mgL,>,,1000,,,,,NOM-127-SSA1-2021 (provisional),mg/L
CHLORIDE_mgL,>,,250,,,,,NOM-127-SSA1-2021 (provisional),mg/L
SULPHATE_mgL,>,,400,,,,,NOM-127-SSA1-2021 (provisional),mg/L
FLUORIDE_mgL,>,,1.5,,,,,NOM-127-SSA1-2021 / OMS (provisional),mg/L
NITRATE_mgLasN,>,,11,,,,,NOM-127-SSA1-2021 (provisional),mg/L
TOTAL_PHOSPHORUS_mgL,>,,0.05,,,,,Referencia general (provisional),mg/L
ARSENIC_TOTAL_ugL,>,,10,,,,,NOM-127-SSA1-2021 / OMS (provisional),ug/L
CADMIUM_TOTAL_ugL,>,,5,,,,,NOM-127-SSA1-2021 (provisional),ug/L
LEAD_TOTAL_ugL,>,,10,,,,,NOM-127-SSA1-2021 / OMS (provisional),ug/L
MERCURY_TOTAL_ugL,>,,6,,,,,NOM-127-SSA1-2021 (provisional),ug/L
CHROMIUM_TOTAL_ugL,>,,50,,,,,NOM-127-SSA1-2021 / OMS (provisional),ug/L
FECAL_COLIFORM_NMP100mL,>,,1000,,,,,CE-CCA-001/89 (provisional),NMP/100mL
E_COLI_NMP100mL,>,,0,,,,,NOM-127-SSA1-2021 (provisional),NMP/100mL
TURBIDITY_NTU,>,,5,,,,,NOM-127-SSA1-2021 (provisional),NTU
```

- [ ] **Step 3: Asegurar la declaración de tipos para imports `?raw` (`src/vite-env.d.ts`)**

Si `src/vite-env.d.ts` NO existe, créalo. Si existe, asegúrate de que contenga la primera línea. Contenido:

```ts
/// <reference types="vite/client" />
```

(Vite ya declara los módulos `*?raw` como `string` vía `vite/client`; no hace falta más.)

- [ ] **Step 4: Escribir la prueba que falla (`src/presets/presets.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { PRESETS, getPreset } from './index'

describe('presets', () => {
  it('expone CCME y México', () => {
    expect(getPreset('ccme')).toBeDefined()
    expect(getPreset('mexico')).toBeDefined()
    expect(PRESETS.map((p) => p.id).sort()).toEqual(['ccme', 'mexico'])
  })
  it('CCME parsea sin códigos no soportados y trae parámetros clave', () => {
    const ccme = getPreset('ccme')!
    expect(ccme.table.get('ARSENIC_TOTAL_ugL')![0].ruleType).toBe('max')
    expect(ccme.table.get('COPPER_TOTAL_ugL')![0].ruleType).toBe('cuHardness')
    expect(ccme.table.get('LEAD_TOTAL_ugL')).toHaveLength(4)
    expect(ccme.table.get('PHOSPHORUS_TOTAL_mgL')).toHaveLength(3)
    // corrección de unidad del hierro
    expect(ccme.table.get('IRON_TOTAL_mgL')![0].unit).toBe('mg/L')
  })
  it('México trae los parámetros mexicanos típicos', () => {
    const mx = getPreset('mexico')!
    expect(mx.table.get('BOD5_mgL')![0].upperLimit).toBe(30)
    expect(mx.table.get('FLUORIDE_mgL')![0].upperLimit).toBe(1.5)
    expect(mx.table.has('E_COLI_NMP100mL')).toBe(true)
  })
})
```

- [ ] **Step 5: Correr y verificar que falla**

Run: `npm test -- src/presets/presets.test.ts`
Expected: FAIL "Cannot find module './index'".

- [ ] **Step 6: Implementar `src/presets/index.ts`**

```ts
import ccmeCsv from './ccme.csv?raw'
import mexicoCsv from './mexico.csv?raw'
import type { GuidelineTable } from '../engine/types'
import { parseGuidelinesCsv } from '../io/parseGuidelines'

export interface Preset {
  id: string
  name: string
  description: string
  table: GuidelineTable
}

export const PRESETS: Preset[] = [
  {
    id: 'ccme',
    name: 'CCME — Vida acuática',
    description:
      'Guías canadienses (CCME) para la protección de la vida acuática. Set de referencia del programa oficial.',
    table: parseGuidelinesCsv(ccmeCsv).table,
  },
  {
    id: 'mexico',
    name: 'México — Plantilla (provisional)',
    description:
      'Plantilla editable con parámetros típicos de México (DBO, DQO, fluoruro, coliformes…). Valores provisionales: verificar contra NOM-127 / CE-CCA / NOM-001 / OMS.',
    table: parseGuidelinesCsv(mexicoCsv).table,
  },
]

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
```

- [ ] **Step 7: Correr y verificar que pasa**

Run: `npm test -- src/presets/presets.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 8: Verificar que el proyecto compila (imports `?raw`)**

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 9: Commit**

```bash
git add src/presets/ src/vite-env.d.ts
git commit -m "feat(presets): set CCME (limpio) y plantilla Mexico provisional, cargados por el parser propio"
```

---

### Task 7: Validación de guías (`validateGuidelines`)

**Files:**
- Create: `src/validation/types.ts`
- Create: `src/validation/validateGuidelines.ts`
- Test: `src/validation/validateGuidelines.test.ts`

**Interfaces:**
- Consumes: `GuidelineTable`, `GuidelineRow` de `../engine/types`.
- Produces:
  - `type Severity = 'error' | 'warn' | 'ok'`
  - `interface ValidationIssue { severity: Severity; code: string; message: string; parameterId?: string; column?: string; row?: number }`
  - `validateGuidelines(table: GuidelineTable): ValidationIssue[]`

- [ ] **Step 1: Crear `src/validation/types.ts`**

```ts
export type Severity = 'error' | 'warn' | 'ok'

export interface ValidationIssue {
  severity: Severity
  code: string
  message: string
  parameterId?: string
  column?: string
  row?: number
}
```

- [ ] **Step 2: Escribir la prueba que falla (`src/validation/validateGuidelines.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { validateGuidelines } from './validateGuidelines'
import type { GuidelineRow, GuidelineTable } from '../engine/types'

function table(rows: GuidelineRow[]): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const r of rows) {
    const a = m.get(r.parameterId) ?? []
    a.push(r)
    m.set(r.parameterId, a)
  }
  return m
}
const row = (o: Partial<GuidelineRow>): GuidelineRow => ({
  parameterId: 'X', ruleType: 'max', lowerLimit: null, upperLimit: null, ...o,
})

describe('validateGuidelines', () => {
  it('error si una regla max no tiene límite superior', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'AS', ruleType: 'max', upperLimit: null })]))
    expect(issues.some((i) => i.severity === 'error' && i.parameterId === 'AS')).toBe(true)
  })
  it('error si una regla min no tiene límite inferior', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'DO', ruleType: 'min', lowerLimit: null })]))
    expect(issues.some((i) => i.severity === 'error' && i.parameterId === 'DO')).toBe(true)
  })
  it('error si un rango tiene inferior >= superior', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'PH', ruleType: 'range', lowerLimit: 9, upperLimit: 6.5 })]))
    expect(issues.some((i) => i.severity === 'error' && i.parameterId === 'PH')).toBe(true)
  })
  it('error si una regla estacional no tiene ventana de fechas', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'TP', ruleType: 'season', upperLimit: 0.02, seasonStart: null, seasonFinish: null })]))
    expect(issues.some((i) => i.severity === 'error' && i.parameterId === 'TP')).toBe(true)
  })
  it('aviso si falta unidad', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'AS', ruleType: 'max', upperLimit: 5, unit: undefined })]))
    expect(issues.some((i) => i.severity === 'warn' && i.parameterId === 'AS')).toBe(true)
  })
  it('guía válida no produce errores', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'AS', ruleType: 'max', upperLimit: 5, unit: 'ug/L' })]))
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Correr y verificar que falla**

Run: `npm test -- src/validation/validateGuidelines.test.ts`
Expected: FAIL "Cannot find module './validateGuidelines'".

- [ ] **Step 4: Implementar `src/validation/validateGuidelines.ts`**

```ts
import type { GuidelineTable, GuidelineRow } from '../engine/types'
import type { ValidationIssue } from './types'

function checkRow(paramId: string, rows: GuidelineRow[], out: ValidationIssue[]): void {
  const rt = rows[0].ruleType

  if (rt === 'max' && rows[0].upperLimit == null) {
    out.push({ severity: 'error', code: 'MAX_SIN_LIMITE', parameterId: paramId, message: `"${paramId}": la regla de máximo requiere un límite superior.` })
  }
  if (rt === 'min' && rows[0].lowerLimit == null) {
    out.push({ severity: 'error', code: 'MIN_SIN_LIMITE', parameterId: paramId, message: `"${paramId}": la regla de mínimo requiere un límite inferior.` })
  }
  if (rt === 'range') {
    const lo = rows[0].lowerLimit
    const hi = rows[0].upperLimit
    if (lo == null && hi == null) {
      out.push({ severity: 'error', code: 'RANGO_SIN_LIMITES', parameterId: paramId, message: `"${paramId}": el rango requiere al menos un límite.` })
    } else if (lo != null && hi != null && lo >= hi) {
      out.push({ severity: 'error', code: 'RANGO_INVERTIDO', parameterId: paramId, message: `"${paramId}": el límite inferior (${lo}) debe ser menor que el superior (${hi}).` })
    }
  }
  if (rt === 'season') {
    for (const r of rows) {
      if (!r.seasonStart || !r.seasonFinish) {
        out.push({ severity: 'error', code: 'ESTACION_SIN_FECHAS', parameterId: paramId, message: `"${paramId}": una regla estacional requiere fecha de inicio y fin.` })
        break
      }
    }
  }
  if (rt === 'hardnessStep') {
    for (const r of rows) {
      if (r.upperLimit == null) {
        out.push({ severity: 'error', code: 'ESCALON_SIN_LIMITE', parameterId: paramId, message: `"${paramId}": cada tramo por dureza requiere un límite.` })
        break
      }
    }
  }
  // Unidad: aviso si falta (pH no lleva unidad, se exime).
  if (paramId.toUpperCase() !== 'PH' && !rows[0].unit) {
    out.push({ severity: 'warn', code: 'SIN_UNIDAD', parameterId: paramId, message: `"${paramId}": no tiene unidad declarada.` })
  }
}

export function validateGuidelines(table: GuidelineTable): ValidationIssue[] {
  const out: ValidationIssue[] = []
  for (const [paramId, rows] of table) {
    checkRow(paramId, rows, out)
  }
  return out
}
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/validation/validateGuidelines.test.ts`
Expected: PASS (6 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/validation/types.ts src/validation/validateGuidelines.ts src/validation/validateGuidelines.test.ts
git commit -m "feat(validation): validateGuidelines (limites, rangos, estacion, unidades)"
```

---

### Task 8: Validación cruzada de datos (`validateData`)

**Files:**
- Create: `src/validation/validateData.ts`
- Test: `src/validation/validateData.test.ts`

**Interfaces:**
- Consumes: `DataRow`, `GuidelineTable` de `../engine/types`; `ValidationIssue` de `./types`; `parseValue` de `../engine/parseValue`.
- Produces:
  - `interface DataValidationResult { matched: string[]; dataWithoutGuideline: string[]; guidelineWithoutData: string[]; issues: ValidationIssue[] }`
  - `validateData(rows: DataRow[], columns: string[], table: GuidelineTable, opts?: { hardnessCol?: string; phCol?: string; tempCol?: string }): DataValidationResult`

- [ ] **Step 1: Escribir la prueba que falla (`src/validation/validateData.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { validateData } from './validateData'
import type { GuidelineRow, GuidelineTable, DataRow } from '../engine/types'

function table(rows: GuidelineRow[]): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const r of rows) {
    const a = m.get(r.parameterId) ?? []
    a.push(r); m.set(r.parameterId, a)
  }
  return m
}
const gl = table([
  { parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' },
  { parameterId: 'CU', ruleType: 'cuHardness', lowerLimit: null, upperLimit: null, unit: 'ug/L' },
  { parameterId: 'PH', ruleType: 'range', lowerLimit: 6.5, upperLimit: 9 },
])

describe('validateData', () => {
  it('clasifica columnas: emparejadas, datos sin guía, guías sin datos', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: '0.02', EXTRA: '1' } }]
    const res = validateData(rows, ['TP', 'EXTRA'], gl)
    expect(res.matched).toContain('TP')
    expect(res.dataWithoutGuideline).toContain('EXTRA')
    expect(res.guidelineWithoutData).toEqual(expect.arrayContaining(['CU', 'PH']))
  })

  it('error si una regla por dureza no tiene columna de dureza', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { CU: '5' } }]
    const res = validateData(rows, ['CU'], gl)
    expect(res.issues.some((i) => i.severity === 'error' && i.code === 'FALTA_DUREZA')).toBe(true)
  })

  it('error si un valor no es numérico', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: 'abc' } }]
    const res = validateData(rows, ['TP'], gl)
    expect(res.issues.some((i) => i.severity === 'error' && i.code === 'VALOR_NO_NUMERICO')).toBe(true)
  })

  it('aviso por pH fuera del rango físico 0–14', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { PH: '20' } }]
    const res = validateData(rows, ['PH'], gl)
    expect(res.issues.some((i) => i.severity === 'warn' && i.code === 'PH_FUERA_DE_RANGO')).toBe(true)
  })

  it('aviso si hay menos de 8 parámetros emparejados', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: '0.02' } }]
    const res = validateData(rows, ['TP'], gl)
    expect(res.issues.some((i) => i.severity === 'warn' && i.code === 'POCOS_PARAMETROS')).toBe(true)
  })

  it('acepta no-detectados sin marcarlos como no numéricos', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: '<0.01' } }]
    const res = validateData(rows, ['TP'], gl)
    expect(res.issues.some((i) => i.code === 'VALOR_NO_NUMERICO')).toBe(false)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/validation/validateData.test.ts`
Expected: FAIL "Cannot find module './validateData'".

- [ ] **Step 3: Implementar `src/validation/validateData.ts`**

```ts
import type { DataRow, GuidelineTable } from '../engine/types'
import type { ValidationIssue } from './types'
import { parseValue } from '../engine/parseValue'

export interface DataValidationResult {
  matched: string[]
  dataWithoutGuideline: string[]
  guidelineWithoutData: string[]
  issues: ValidationIssue[]
}

const HARDNESS_RULES = new Set(['cdHardness', 'cuHardness', 'niHardness', 'pbHardness', 'znHardness', 'hardnessStep'])

export function validateData(
  rows: DataRow[],
  columns: string[],
  table: GuidelineTable,
  opts: { hardnessCol?: string; phCol?: string; tempCol?: string } = {},
): DataValidationResult {
  const hardnessCol = opts.hardnessCol ?? 'HARDNESS'
  const phCol = opts.phCol ?? 'PH'
  const tempCol = opts.tempCol ?? 'TEMP'

  const issues: ValidationIssue[] = []
  const colSet = new Set(columns)

  const matched = columns.filter((c) => table.has(c))
  const dataWithoutGuideline = columns.filter((c) => !table.has(c))
  const guidelineWithoutData = [...table.keys()].filter((p) => !colSet.has(p))

  // Dependencias de contexto (dureza/pH/temp) por tipo de regla.
  for (const p of matched) {
    const rt = table.get(p)![0].ruleType
    if (HARDNESS_RULES.has(rt) && !colSet.has(hardnessCol)) {
      issues.push({ severity: 'error', code: 'FALTA_DUREZA', parameterId: p, message: `"${p}" usa una guía por dureza pero no existe la columna "${hardnessCol}".` })
    }
    if (rt === 'alPh' && !colSet.has(phCol)) {
      issues.push({ severity: 'error', code: 'FALTA_PH', parameterId: p, message: `"${p}" usa una guía por pH pero no existe la columna "${phCol}".` })
    }
    if (rt === 'ammonia' && (!colSet.has(phCol) || !colSet.has(tempCol))) {
      issues.push({ severity: 'error', code: 'FALTA_PH_TEMP', parameterId: p, message: `"${p}" (amoníaco) requiere columnas "${phCol}" y "${tempCol}".` })
    }
  }

  // Validación por celda (solo columnas emparejadas).
  rows.forEach((r, i) => {
    const rowNum = i + 2
    for (const p of matched) {
      const raw = r.values[p]
      if (raw == null || raw === '') continue
      const { value } = parseValue(raw)
      if (value == null) {
        issues.push({ severity: 'error', code: 'VALOR_NO_NUMERICO', parameterId: p, column: p, row: rowNum, message: `Fila ${rowNum}, "${p}": valor no numérico "${raw}".` })
        continue
      }
      if (p.toUpperCase() === phCol.toUpperCase() && (value < 0 || value > 14)) {
        issues.push({ severity: 'warn', code: 'PH_FUERA_DE_RANGO', parameterId: p, column: p, row: rowNum, message: `Fila ${rowNum}: pH ${value} fuera del rango físico 0–14.` })
      }
      if (value < 0) {
        issues.push({ severity: 'warn', code: 'VALOR_NEGATIVO', parameterId: p, column: p, row: rowNum, message: `Fila ${rowNum}, "${p}": valor negativo (${value}).` })
      }
    }
  })

  // Requisitos del índice.
  if (matched.length < 8) {
    issues.push({ severity: 'warn', code: 'POCOS_PARAMETROS', message: `Solo ${matched.length} parámetros emparejados; el manual recomienda al menos 8.` })
  }

  return { matched, dataWithoutGuideline, guidelineWithoutData, issues }
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/validation/validateData.test.ts`
Expected: PASS (6 pruebas).

- [ ] **Step 5: Correr TODA la suite y verificar el build**

Run: `npm test`
Expected: PASS en todos los archivos (motor + io + presets + validación).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 6: Commit**

```bash
git add src/validation/validateData.ts src/validation/validateData.test.ts
git commit -m "feat(validation): validateData (emparejamiento, dependencias, tipos, rangos, requisitos)"
```

---

## Self-Review

**1. Cobertura del spec (§5, §6, §7 del diseño):**
- Parseo de guías CSV con mapeo `EXCEED_IF`→RuleType (incl. `COMPUTE`→amoníaco, provinciales no soportadas) → Task 1–2. ✅
- Parseo de datos formato ancho, no-detectados crudos, fechas → Task 3. ✅
- Excel → Task 4. ✅
- Serialización a formato oficial (round-trip) → Task 5. ✅
- Presets CCME (limpio) + plantilla México → Task 6. ✅
- Validación de guías (límites, rangos, estación, unidades) → Task 7. ✅
- Validación cruzada de datos (emparejamiento, datos sin guía / guías sin datos, dependencias dureza/pH/temp, tipos, rangos físicos, requisito mín. parámetros, no-detectados) → Task 8. ✅
- Restricción "sin variantes provinciales" → `codeToRuleType` las rechaza (Task 1) y `parseGuidelinesCsv` las registra como issue (Task 2). ✅

**2. Placeholders:** ninguno; el preset CCME se transcribe con contenido exacto y las dos correcciones indicadas; el de México es explícitamente provisional y citado.

**3. Consistencia de tipos:** `ValidationIssue`/`Severity` definidos en Task 7 (`src/validation/types.ts`) y reutilizados en Task 8. `GuidelineParseResult`/`ParseIssue` (Task 2), `DataParseResult` (Task 3), `Preset` (Task 6), `DataValidationResult` (Task 8) con firmas coherentes. `parseValue` y los tipos del motor se consumen sin modificarlos.

**Fuera de alcance (fases siguientes):** UI de Guías (Fase 3), UI de Datos (Fase 4), Resultados/gráficas (Fase 5), Ayuda (Fase 6), persistencia `.ica.json`/localStorage + despliegue afinado (Fase 7). La validación de la plantilla México contra la NOM vigente y la lista definitiva de parámetros mexicanos queda pendiente de confirmación con el equipo (marcada "provisional").
