# Fase 1 — Motor WQI (TypeScript) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el motor de cálculo del CCME WQI como módulo TypeScript puro (sin UI), validado por pruebas, incluyendo la regresión del ejemplo del manual (WQI = 88).

**Architecture:** Módulo `src/engine/` sin dependencias de React ni de I/O. Consume estructuras ya parseadas (filas de datos + tabla de guías) y produce resultados por estación. Cada archivo tiene una responsabilidad: parseo de valores, fórmulas de guías dependientes de química, resolución de guías, excursión/pass-fail, factores del índice, y orquestación por estación. TDD con Vitest.

**Tech Stack:** TypeScript, Vitest. (El proyecto ya está en React + Vite + TS.)

## Global Constraints

- Sitio 100% estático; el motor corre en el navegador — **cero dependencias de Node/servidor** en `src/engine/`.
- Idioma del producto: español (no aplica a nombres de identificadores del motor, que van en inglés técnico).
- **Sin variantes provinciales** (Manitoba/Alberta/BC). Solo CCME federal + reglas simples.
- El motor NO depende de React ni de librerías de I/O (Papa Parse, SheetJS). Es puro.
- Regla de regresión **bloqueante**: el ejemplo del manual debe dar F1=20, F2≈3.9, F3≈2.8, **WQI≈88**.
- Fórmulas exactas verificadas contra el binario oficial (ver valores en Task 2).

---

### Task 1: Configurar Vitest + tipos base + parseo de valores

**Files:**
- Modify: `package.json` (agregar dependencia dev `vitest` y script `test`)
- Create: `vitest.config.ts`
- Create: `src/engine/types.ts`
- Create: `src/engine/parseValue.ts`
- Test: `src/engine/parseValue.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `types.ts`: `RuleType`, `EvalMode`, `GuidelineRow`, `GuidelineTable`, `SampleContext`, `ResolvedGuideline`, `DataRow`, `StationResult`, `ComputeOptions`.
  - `parseValue(raw: string | null | undefined): ParsedValue` donde `ParsedValue = { value: number | null; nonDetect: boolean }`.

- [ ] **Step 1: Instalar Vitest**

Run: `npm install -D vitest`
Expected: se agrega `vitest` a `devDependencies` sin errores.

- [ ] **Step 2: Agregar script de pruebas a `package.json`**

En la sección `"scripts"` agregar:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Crear `src/engine/types.ts`**

```ts
export type RuleType =
  | 'max'
  | 'min'
  | 'range'
  | 'hardnessStep'
  | 'season'
  | 'ammonia'
  | 'alPh'
  | 'cdHardness'
  | 'cuHardness'
  | 'niHardness'
  | 'pbHardness'
  | 'znHardness'

export type EvalMode = 'max' | 'min' | 'range'

export interface GuidelineRow {
  parameterId: string
  ruleType: RuleType
  lowerLimit: number | null
  upperLimit: number | null
  hardnessLower?: number | null
  hardnessUpper?: number | null
  seasonStart?: string | null
  seasonFinish?: string | null
  unit?: string
  source?: string
}

/** paramId -> filas (season y hardnessStep usan varias filas). */
export type GuidelineTable = Map<string, GuidelineRow[]>

export interface SampleContext {
  hardness: number | null
  pH: number | null
  temp: number | null
  date: Date | null
}

export interface ResolvedGuideline {
  /** número para max/min; tupla [inf, sup] para range. */
  target: number | [number | null, number | null]
  mode: EvalMode
}

export interface DataRow {
  station: string
  date: Date | null
  /** valores crudos por columna de parámetro (aún sin parsear). */
  values: Record<string, string>
}

export interface StationResult {
  station: string
  nParams: number
  nTests: number
  failedParams: string[]
  nFailedTests: number
  f1: number
  f2: number
  f3: number
  nse: number
  wqi: number
  category: string
}

export interface ComputeOptions {
  hardnessCol?: string
  phCol?: string
  tempCol?: string
}
```

- [ ] **Step 5: Escribir la prueba que falla (`src/engine/parseValue.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { parseValue } from './parseValue'

describe('parseValue', () => {
  it('parsea un número normal', () => {
    expect(parseValue('12.3')).toEqual({ value: 12.3, nonDetect: false })
  })
  it('trata "<0.01" como no detectado en el valor del límite', () => {
    expect(parseValue('<0.01')).toEqual({ value: 0.01, nonDetect: true })
  })
  it('trata "L0.05" como no detectado', () => {
    expect(parseValue('L0.05')).toEqual({ value: 0.05, nonDetect: true })
  })
  it('celda vacía -> null', () => {
    expect(parseValue('')).toEqual({ value: null, nonDetect: false })
    expect(parseValue(null)).toEqual({ value: null, nonDetect: false })
    expect(parseValue(undefined)).toEqual({ value: null, nonDetect: false })
  })
  it('texto no numérico -> null', () => {
    expect(parseValue('abc')).toEqual({ value: null, nonDetect: false })
  })
})
```

- [ ] **Step 6: Correr la prueba y verificar que falla**

Run: `npm test -- src/engine/parseValue.test.ts`
Expected: FAIL con "Cannot find module './parseValue'".

- [ ] **Step 7: Implementar `src/engine/parseValue.ts`**

```ts
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
```

- [ ] **Step 8: Correr la prueba y verificar que pasa**

Run: `npm test -- src/engine/parseValue.test.ts`
Expected: PASS (5 pruebas).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/engine/types.ts src/engine/parseValue.ts src/engine/parseValue.test.ts
git commit -m "feat(engine): tipos base, parseValue y setup de Vitest"
```

---

### Task 2: Fórmulas de guías dependientes de química

**Files:**
- Create: `src/engine/formulas.ts`
- Test: `src/engine/formulas.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces (todas devuelven `number`; unidades: metales µg/L, aluminio mg/L, amoníaco mg/L N):
  - `cadmiumGuideline(hardness: number): number`
  - `copperGuideline(hardness: number): number`
  - `nickelGuideline(hardness: number): number`
  - `leadGuideline(hardness: number): number`
  - `zincGuideline(hardness: number): number`
  - `aluminumGuideline(pH: number): number`
  - `ammoniaTotalGuideline(unionizedLimit: number, pH: number, tempC: number): number`

- [ ] **Step 1: Escribir la prueba que falla (`src/engine/formulas.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import {
  cadmiumGuideline,
  copperGuideline,
  nickelGuideline,
  leadGuideline,
  zincGuideline,
  aluminumGuideline,
  ammoniaTotalGuideline,
} from './formulas'

describe('fórmulas dependientes de dureza/pH (verificadas vs binario oficial)', () => {
  it('cadmio: techo/piso y fórmula', () => {
    expect(cadmiumGuideline(10)).toBeCloseTo(0.04, 5) // H<17 -> 0.04
    expect(cadmiumGuideline(400)).toBeCloseTo(0.37, 5) // H>280 -> 0.37
    expect(cadmiumGuideline(100)).toBeCloseTo(0.1585, 3) // 10^(0.83*2-2.46)
  })
  it('cobre: mesetas y fórmula', () => {
    expect(copperGuideline(50)).toBe(2) // H<82
    expect(copperGuideline(312)).toBe(4) // H>180
    expect(copperGuideline(100)).toBeCloseTo(2.364, 2)
  })
  it('níquel: mesetas y fórmula', () => {
    expect(nickelGuideline(50)).toBe(25) // H<=60
    expect(nickelGuideline(312)).toBe(150) // H>180
    expect(nickelGuideline(100)).toBeCloseTo(95.5, 1)
  })
  it('plomo: mesetas y fórmula', () => {
    expect(leadGuideline(50)).toBe(1) // H<60
    expect(leadGuideline(312)).toBe(7) // H>180
    expect(leadGuideline(100)).toBeCloseTo(3.18, 2)
  })
  it('zinc: lineal por dureza', () => {
    expect(zincGuideline(50)).toBe(7.5) // H<90
    expect(zincGuideline(312)).toBeCloseTo(174, 5) // 7.5+0.75*(312-90)
  })
  it('aluminio: por pH', () => {
    expect(aluminumGuideline(6.0)).toBe(0.005)
    expect(aluminumGuideline(7.0)).toBe(0.1)
  })
  it('amoníaco: guía de amoníaco total desde el límite no ionizado', () => {
    // f = 1/(1+10^(0.09018 + 2729.92/(273.2+T) - pH)); guía_total = límite/f
    expect(ammoniaTotalGuideline(0.0152, 8, 20)).toBeCloseTo(0.398, 2)
  })
})
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm test -- src/engine/formulas.test.ts`
Expected: FAIL con "Cannot find module './formulas'".

- [ ] **Step 3: Implementar `src/engine/formulas.ts`**

```ts
// Fórmulas extraídas por ingeniería inversa del binario oficial CCMEWQI.exe
// (métodos Calc_Cd, Calc_Cu, Calc_Ni, Calc_Pb, Calc_Zn, Calc_AlCCME, Calc_Ammonia)
// y verificadas contra el ejemplo del manual. H = dureza (mg/L CaCO3); T = °C.

/** Cadmio (µg/L). H<17 -> 0.04; H>280 -> 0.37; si no 10^(0.83·log10 H − 2.46). */
export function cadmiumGuideline(hardness: number): number {
  if (hardness < 17) return 0.04
  if (hardness > 280) return 0.37
  return Math.pow(10, 0.83 * Math.log10(hardness) - 2.46)
}

/** Cobre (µg/L). H<82 -> 2; H>180 -> 4; si no 0.2·e^(0.8545·ln H − 1.465). */
export function copperGuideline(hardness: number): number {
  if (hardness < 82) return 2
  if (hardness > 180) return 4
  return 0.2 * Math.exp(0.8545 * Math.log(hardness) - 1.465)
}

/** Níquel (µg/L). H<=60 -> 25; H>180 -> 150; si no e^(0.76·ln H + 1.06). */
export function nickelGuideline(hardness: number): number {
  if (hardness <= 60) return 25
  if (hardness > 180) return 150
  return Math.exp(0.76 * Math.log(hardness) + 1.06)
}

/** Plomo (µg/L). H<60 -> 1; H>180 -> 7; si no e^(1.273·ln H − 4.705). */
export function leadGuideline(hardness: number): number {
  if (hardness < 60) return 1
  if (hardness > 180) return 7
  return Math.exp(1.273 * Math.log(hardness) - 4.705)
}

/** Zinc (µg/L). H<90 -> 7.5; si no 7.5 + 0.75·(H − 90). */
export function zincGuideline(hardness: number): number {
  if (hardness < 90) return 7.5
  return 7.5 + 0.75 * (hardness - 90)
}

/** Aluminio (mg/L). pH<6.5 -> 0.005; si no 0.1. */
export function aluminumGuideline(pH: number): number {
  return pH < 6.5 ? 0.005 : 0.1
}

/**
 * Guía de amoníaco TOTAL (mg/L N) equivalente al límite del amoníaco no
 * ionizado, dado pH y temperatura. fracción no ionizada:
 * f = 1/(1 + 10^(0.09018 + 2729.92/(273.2+T) − pH)); guía_total = límite/f.
 */
export function ammoniaTotalGuideline(unionizedLimit: number, pH: number, tempC: number): number {
  const f = 1 / (1 + Math.pow(10, 0.09018 + 2729.92 / (273.2 + tempC) - pH))
  return unionizedLimit / f
}
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npm test -- src/engine/formulas.test.ts`
Expected: PASS (7 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/engine/formulas.ts src/engine/formulas.test.ts
git commit -m "feat(engine): formulas de guias dependientes de dureza/pH/temp"
```

---

### Task 3: Resolución de guías por muestra

**Files:**
- Create: `src/engine/resolveGuideline.ts`
- Test: `src/engine/resolveGuideline.test.ts`

**Interfaces:**
- Consumes: `GuidelineRow`, `SampleContext`, `ResolvedGuideline` (de `types.ts`); funciones de `formulas.ts`.
- Produces:
  - `resolveGuideline(rows: GuidelineRow[], ctx: SampleContext): ResolvedGuideline | null`
  - `monthDay(s: string): { month: number; day: number } | null` (auxiliar exportado para pruebas; interpreta "1-Jan" / "30-Apr").

- [ ] **Step 1: Escribir la prueba que falla (`src/engine/resolveGuideline.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { resolveGuideline } from './resolveGuideline'
import type { GuidelineRow, SampleContext } from './types'

const ctx = (o: Partial<SampleContext> = {}): SampleContext => ({
  hardness: null, pH: null, temp: null, date: null, ...o,
})
const row = (o: Partial<GuidelineRow>): GuidelineRow => ({
  parameterId: 'X', ruleType: 'max', lowerLimit: null, upperLimit: null, ...o,
})

describe('resolveGuideline', () => {
  it('max: usa upperLimit', () => {
    expect(resolveGuideline([row({ ruleType: 'max', upperLimit: 5 })], ctx()))
      .toEqual({ target: 5, mode: 'max' })
  })
  it('min: usa lowerLimit', () => {
    expect(resolveGuideline([row({ ruleType: 'min', lowerLimit: 9.5 })], ctx()))
      .toEqual({ target: 9.5, mode: 'min' })
  })
  it('range: tupla inf/sup', () => {
    expect(resolveGuideline([row({ ruleType: 'range', lowerLimit: 6.5, upperLimit: 9 })], ctx()))
      .toEqual({ target: [6.5, 9], mode: 'range' })
  })
  it('cuHardness: calcula con la dureza de la muestra', () => {
    const r = resolveGuideline([row({ ruleType: 'cuHardness' })], ctx({ hardness: 312 }))
    expect(r).toEqual({ target: 4, mode: 'max' })
  })
  it('alPh: calcula con el pH de la muestra', () => {
    expect(resolveGuideline([row({ ruleType: 'alPh' })], ctx({ pH: 6.0 })))
      .toEqual({ target: 0.005, mode: 'max' })
  })
  it('hardnessStep: elige el tramo por dureza (plomo)', () => {
    const rows: GuidelineRow[] = [
      row({ ruleType: 'hardnessStep', upperLimit: 1, hardnessLower: 0, hardnessUpper: 60 }),
      row({ ruleType: 'hardnessStep', upperLimit: 7, hardnessLower: 180, hardnessUpper: null }),
    ]
    expect(resolveGuideline(rows, ctx({ hardness: 312 }))).toEqual({ target: 7, mode: 'max' })
  })
  it('season: elige el límite por fecha', () => {
    const rows: GuidelineRow[] = [
      row({ ruleType: 'season', upperLimit: 0.03, seasonStart: '1-Jan', seasonFinish: '30-Apr' }),
      row({ ruleType: 'season', upperLimit: 0.02, seasonStart: '1-May', seasonFinish: '31-Oct' }),
    ]
    const r = resolveGuideline(rows, ctx({ date: new Date(2008, 5, 3) })) // 3-Jun
    expect(r).toEqual({ target: 0.02, mode: 'max' })
  })
  it('devuelve null si falta el contexto requerido', () => {
    expect(resolveGuideline([row({ ruleType: 'cuHardness' })], ctx({ hardness: null }))).toBeNull()
  })
  it('devuelve null si no hay límite numérico', () => {
    expect(resolveGuideline([row({ ruleType: 'max', upperLimit: null })], ctx())).toBeNull()
  })
})
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm test -- src/engine/resolveGuideline.test.ts`
Expected: FAIL con "Cannot find module './resolveGuideline'".

- [ ] **Step 3: Implementar `src/engine/resolveGuideline.ts`**

```ts
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
    case 'ammonia':
      if (ctx.pH == null || ctx.temp == null) return null
      const limit = rows[0].lowerLimit ?? rows[0].upperLimit
      if (limit == null) return null
      return { target: ammoniaTotalGuideline(limit, ctx.pH, ctx.temp), mode: 'max' }
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
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npm test -- src/engine/resolveGuideline.test.ts`
Expected: PASS (9 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/engine/resolveGuideline.ts src/engine/resolveGuideline.test.ts
git commit -m "feat(engine): resolucion de guias por muestra (todos los tipos de regla)"
```

---

### Task 4: Excursión y pass/fail

**Files:**
- Create: `src/engine/excursion.ts`
- Test: `src/engine/excursion.test.ts`

**Interfaces:**
- Consumes: `ResolvedGuideline` (de `types.ts`).
- Produces:
  - `evaluate(value: number, g: ResolvedGuideline): { fail: boolean; excursion: number }`

- [ ] **Step 1: Escribir la prueba que falla (`src/engine/excursion.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { evaluate } from './excursion'

describe('evaluate (excursión y pass/fail)', () => {
  it('max: falla si valor > objetivo, excursión = valor/obj − 1', () => {
    expect(evaluate(0.058, { target: 0.05, mode: 'max' })).toEqual({ fail: true, excursion: 0.058 / 0.05 - 1 })
  })
  it('max: pasa si valor <= objetivo', () => {
    expect(evaluate(0.04, { target: 0.05, mode: 'max' })).toEqual({ fail: false, excursion: 0 })
  })
  it('min: falla si valor < objetivo, excursión = obj/valor − 1', () => {
    expect(evaluate(8, { target: 9.5, mode: 'min' })).toEqual({ fail: true, excursion: 9.5 / 8 - 1 })
  })
  it('range: falla por debajo del inferior', () => {
    const r = evaluate(6.0, { target: [6.5, 9], mode: 'range' })
    expect(r.fail).toBe(true)
    expect(r.excursion).toBeCloseTo(6.5 / 6.0 - 1, 6)
  })
  it('range: falla por encima del superior', () => {
    const r = evaluate(9.5, { target: [6.5, 9], mode: 'range' })
    expect(r.fail).toBe(true)
    expect(r.excursion).toBeCloseTo(9.5 / 9 - 1, 6)
  })
  it('range: pasa dentro del intervalo', () => {
    expect(evaluate(7.5, { target: [6.5, 9], mode: 'range' })).toEqual({ fail: false, excursion: 0 })
  })
})
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm test -- src/engine/excursion.test.ts`
Expected: FAIL con "Cannot find module './excursion'".

- [ ] **Step 3: Implementar `src/engine/excursion.ts`**

```ts
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
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npm test -- src/engine/excursion.test.ts`
Expected: PASS (6 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/engine/excursion.ts src/engine/excursion.test.ts
git commit -m "feat(engine): excursion y pass/fail (max/min/range)"
```

---

### Task 5: Factores del índice y regresión del manual (WQI = 88)

**Files:**
- Create: `src/engine/indexCalc.ts`
- Test: `src/engine/indexCalc.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `computeF1(failedParams: number, totalParams: number): number`
  - `computeF2(failedTests: number, totalTests: number): number`
  - `computeNse(excursions: number[], totalTests: number): number`
  - `computeF3(nse: number): number`
  - `computeWQI(f1: number, f2: number, f3: number): number`
  - `category(wqi: number): string`

- [ ] **Step 1: Escribir la prueba que falla (`src/engine/indexCalc.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { computeF1, computeF2, computeNse, computeF3, computeWQI, category } from './indexCalc'

describe('factores del índice', () => {
  it('F1 = % de parámetros que fallan', () => {
    expect(computeF1(2, 10)).toBe(20)
  })
  it('F2 = % de pruebas que fallan', () => {
    expect(computeF2(4, 103)).toBeCloseTo(3.883, 3)
  })
  it('F3 = nse/(0.01·nse+0.01)', () => {
    expect(computeF3(0)).toBe(0)
    expect(computeF3(1)).toBe(50)
  })
  it('categorías', () => {
    expect(category(97)).toBe('Excellent')
    expect(category(88)).toBe('Good')
    expect(category(70)).toBe('Fair')
    expect(category(50)).toBe('Marginal')
    expect(category(30)).toBe('Poor')
  })
})

describe('REGRESIÓN: ejemplo del manual (río North Saskatchewan, 1997)', () => {
  it('reproduce F1=20, F2≈3.9, F3≈2.8, WQI≈88', () => {
    const f1 = computeF1(2, 10)
    const f2 = computeF2(4, 103)
    const nse = computeNse([0.16, 1.16, 1.35, 0.275], 103)
    const f3 = computeF3(nse)
    const wqi = computeWQI(f1, f2, f3)
    expect(f1).toBe(20)
    expect(f2).toBeCloseTo(3.9, 1)
    expect(f3).toBeCloseTo(2.8, 1)
    expect(Math.round(wqi)).toBe(88)
  })
})
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm test -- src/engine/indexCalc.test.ts`
Expected: FAIL con "Cannot find module './indexCalc'".

- [ ] **Step 3: Implementar `src/engine/indexCalc.ts`**

```ts
export function computeF1(failedParams: number, totalParams: number): number {
  return totalParams === 0 ? 0 : (failedParams / totalParams) * 100
}

export function computeF2(failedTests: number, totalTests: number): number {
  return totalTests === 0 ? 0 : (failedTests / totalTests) * 100
}

export function computeNse(excursions: number[], totalTests: number): number {
  if (totalTests === 0) return 0
  const sum = excursions.reduce((a, b) => a + b, 0)
  return sum / totalTests
}

export function computeF3(nse: number): number {
  if (nse <= 0) return 0
  return nse / (0.01 * nse + 0.01)
}

export function computeWQI(f1: number, f2: number, f3: number): number {
  return 100 - Math.sqrt(f1 * f1 + f2 * f2 + f3 * f3) / 1.732
}

export function category(wqi: number): string {
  if (wqi >= 95) return 'Excellent'
  if (wqi >= 80) return 'Good'
  if (wqi >= 65) return 'Fair'
  if (wqi >= 45) return 'Marginal'
  return 'Poor'
}
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

Run: `npm test -- src/engine/indexCalc.test.ts`
Expected: PASS (6 pruebas, incluida la regresión WQI=88).

- [ ] **Step 5: Commit**

```bash
git add src/engine/indexCalc.ts src/engine/indexCalc.test.ts
git commit -m "feat(engine): factores F1/F2/F3, WQI, categorias + regresion del manual (WQI=88)"
```

---

### Task 6: Orquestación por estación (motor completo)

**Files:**
- Create: `src/engine/computeStations.ts`
- Create: `src/engine/index.ts` (barrel de exportación del motor)
- Test: `src/engine/computeStations.test.ts`

**Interfaces:**
- Consumes: `DataRow`, `GuidelineTable`, `StationResult`, `ComputeOptions`, `SampleContext` (types); `parseValue`; `resolveGuideline`; `evaluate`; `computeF1/F2/F3/computeNse/computeWQI/category`.
- Produces:
  - `computeStations(rows: DataRow[], guidelines: GuidelineTable, options?: ComputeOptions): StationResult[]`
  - `index.ts` reexporta: `parseValue`, `resolveGuideline`, `evaluate`, todo `indexCalc`, `computeStations`, y los tipos.

- [ ] **Step 1: Escribir la prueba que falla (`src/engine/computeStations.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { computeStations } from './computeStations'
import type { GuidelineRow, GuidelineTable, DataRow } from './types'

function table(rows: GuidelineRow[]): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const r of rows) {
    const arr = m.get(r.parameterId) ?? []
    arr.push(r)
    m.set(r.parameterId, arr)
  }
  return m
}

const gl = table([
  { parameterId: 'DO', ruleType: 'min', lowerLimit: 5, upperLimit: null },
  { parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 },
])

const rows: DataRow[] = [
  { station: 'S1', date: new Date(2020, 0, 1), values: { DO: '6', TP: '0.10' } }, // TP falla (0.10>0.05)
  { station: 'S1', date: new Date(2020, 1, 1), values: { DO: '4', TP: '0.02' } }, // DO falla (4<5)
]

describe('computeStations', () => {
  it('cuenta parámetros, pruebas y fallas por estación', () => {
    const res = computeStations(rows, gl)
    expect(res).toHaveLength(1)
    const s = res[0]
    expect(s.station).toBe('S1')
    expect(s.nParams).toBe(2) // DO y TP
    expect(s.nTests).toBe(4) // 2 fechas × 2 parámetros
    expect(s.nFailedTests).toBe(2)
    expect(s.failedParams.sort()).toEqual(['DO', 'TP'])
    expect(s.f1).toBe(100) // 2 de 2 parámetros fallan
    expect(s.f2).toBe(50) // 2 de 4 pruebas
  })

  it('excluye celdas vacías del conteo de pruebas', () => {
    const r: DataRow[] = [
      { station: 'A', date: new Date(2020, 0, 1), values: { TP: '0.02' } },
      { station: 'A', date: new Date(2020, 1, 1), values: { TP: '' } },
    ]
    const res = computeStations(r, table([
      { parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 },
    ]))
    expect(res[0].nTests).toBe(1)
  })

  it('regla del límite de detección: si LD > guía, se usa el LD como guía (no falla)', () => {
    const r: DataRow[] = [
      { station: 'A', date: new Date(2020, 0, 1), values: { CD: '<0.1' } },
    ]
    const res = computeStations(r, table([
      { parameterId: 'CD', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 },
    ]))
    expect(res[0].nFailedTests).toBe(0) // el no-detectado a 0.1 no cuenta como falla
  })

  it('usa dureza/pH/temp de columnas configurables', () => {
    const r: DataRow[] = [
      { station: 'A', date: new Date(2020, 0, 1), values: { HARDNESS: '312', CU: '5' } },
    ]
    const res = computeStations(r, table([
      { parameterId: 'CU', ruleType: 'cuHardness', lowerLimit: null, upperLimit: null },
    ]))
    // dureza 312 -> guía cobre 4 µg/L; valor 5 > 4 -> falla
    expect(res[0].nFailedTests).toBe(1)
  })
})
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Run: `npm test -- src/engine/computeStations.test.ts`
Expected: FAIL con "Cannot find module './computeStations'".

- [ ] **Step 3: Implementar `src/engine/computeStations.ts`**

```ts
import type {
  DataRow, GuidelineTable, StationResult, ComputeOptions, SampleContext,
} from './types'
import { parseValue } from './parseValue'
import { resolveGuideline } from './resolveGuideline'
import { evaluate } from './excursion'
import { computeF1, computeF2, computeNse, computeF3, computeWQI, category } from './indexCalc'

export function computeStations(
  rows: DataRow[],
  guidelines: GuidelineTable,
  options: ComputeOptions = {},
): StationResult[] {
  const hardnessCol = options.hardnessCol ?? 'HARDNESS'
  const phCol = options.phCol ?? 'PH'
  const tempCol = options.tempCol ?? 'TEMP'

  // agrupar filas por estación
  const byStation = new Map<string, DataRow[]>()
  for (const r of rows) {
    const arr = byStation.get(r.station) ?? []
    arr.push(r)
    byStation.set(r.station, arr)
  }

  const results: StationResult[] = []

  for (const [station, srows] of byStation) {
    const paramsPresent = new Set<string>()
    const failedParams = new Set<string>()
    let totalTests = 0
    let failedTests = 0
    const excursions: number[] = []

    for (const r of srows) {
      const ctx: SampleContext = {
        hardness: parseValue(r.values[hardnessCol]).value,
        pH: parseValue(r.values[phCol]).value,
        temp: parseValue(r.values[tempCol]).value,
        date: r.date,
      }

      for (const [paramId, glRows] of guidelines) {
        const raw = r.values[paramId]
        const parsed = parseValue(raw)
        if (parsed.value == null) continue // dato faltante

        const resolved = resolveGuideline(glRows, ctx)
        if (resolved == null) continue // sin guía aplicable / falta contexto

        // Regla del manual: si el LD supera la guía, usar el LD como guía.
        let g = resolved
        if (parsed.nonDetect && resolved.mode === 'max' && typeof resolved.target === 'number') {
          if (parsed.value > resolved.target) g = { target: parsed.value, mode: 'max' }
        }

        paramsPresent.add(paramId)
        totalTests += 1
        const { fail, excursion } = evaluate(parsed.value, g)
        if (fail) {
          failedTests += 1
          failedParams.add(paramId)
          excursions.push(excursion)
        }
      }
    }

    const nParams = paramsPresent.size
    const f1 = computeF1(failedParams.size, nParams)
    const f2 = computeF2(failedTests, totalTests)
    const nse = computeNse(excursions, totalTests)
    const f3 = computeF3(nse)
    const wqi = computeWQI(f1, f2, f3)

    results.push({
      station,
      nParams,
      nTests: totalTests,
      failedParams: [...failedParams].sort(),
      nFailedTests: failedTests,
      f1, f2, f3, nse, wqi,
      category: category(wqi),
    })
  }

  return results
}
```

- [ ] **Step 4: Crear el barrel `src/engine/index.ts`**

```ts
export * from './types'
export { parseValue } from './parseValue'
export * from './formulas'
export { resolveGuideline, monthDay } from './resolveGuideline'
export { evaluate } from './excursion'
export { computeF1, computeF2, computeNse, computeF3, computeWQI, category } from './indexCalc'
export { computeStations } from './computeStations'
```

- [ ] **Step 5: Correr TODAS las pruebas del motor y verificar que pasan**

Run: `npm test`
Expected: PASS en todos los archivos (`parseValue`, `formulas`, `resolveGuideline`, `excursion`, `indexCalc`, `computeStations`), incluida la regresión WQI=88.

- [ ] **Step 6: Verificar que el proyecto sigue compilando**

Run: `npm run build`
Expected: build exitoso (`dist/` generado) sin errores de TypeScript.

- [ ] **Step 7: Commit**

```bash
git add src/engine/computeStations.ts src/engine/index.ts src/engine/computeStations.test.ts
git commit -m "feat(engine): orquestacion por estacion y barrel del motor WQI"
```

---

## Self-Review

**1. Cobertura del spec (§5 Motor y modelo de reglas):**
- Tipos de regla `>`, `<`, `<>` → Task 3 (`max`/`min`/`range`). ✅
- Fórmulas Cd/Cu/Ni/Pb/Zn/Al/amoníaco → Task 2. ✅
- `hardnessStep`, `season`, `alPh`, `*Hardness`, `ammonia` → Task 3. ✅
- Excursión 3a/3b y rango → Task 4. ✅
- F1/F2/F3/nse/WQI/categorías → Task 5. ✅
- No detectados, LD>guía, datos faltantes, solo parámetros con dato+guía, agregación por estación → Task 6. ✅
- Regresión WQI=88 → Task 5. ✅
- Sin variantes provinciales → no se implementan (constraint respetada). ✅
- Selección de periodo (1/3/todos): **fuera de esta fase** — se maneja en la fase de UI pre-filtrando `rows`; el motor calcula sobre las filas recibidas. Anotado como límite de alcance de la Fase 1.

**2. Placeholders:** ninguno; todo el código está completo.

**3. Consistencia de tipos:** `ResolvedGuideline.target` es `number | [number|null, number|null]`; `evaluate` hace el cast por `mode` de forma consistente. `SampleContext`, `GuidelineRow`, `DataRow`, `StationResult` se usan con las mismas firmas en Tasks 3–6. Nombres de funciones (`computeStations`, `resolveGuideline`, `evaluate`, `computeF1/F2/F3`) coinciden entre definición e importación.

**Alcance de fases siguientes (planes separados):** Fase 2 IO/presets/validación; Fase 3 Módulo Guías; Fase 4 Módulo Datos; Fase 5 Resultados/gráficas; Fase 6 Ayuda; Fase 7 persistencia/despliegue.
