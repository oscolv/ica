# Fase 5B — Tendencia temporal y mapa de calor · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el Módulo Resultados con dos gráficas: la tendencia del WQI por año (por estación) y un mapa de calor de excedencias (parámetro × fecha, coloreado por magnitud del exceso).

**Architecture:** Dos derivaciones puras en `src/results/` — `computeYearlyWqi` (agrupa filas por año y reutiliza `computeStations`) y `computeCells` (recalcula por celda con `resolveGuideline`/`evaluate`/`parseValue` del motor, sin modificarlo) — y dos componentes SVG/CSS en `src/ui/resultados/` (TrendChart, Heatmap) integrados en el `ResultadosModule` existente. Sin dependencias nuevas.

**Tech Stack:** React, Vite, TypeScript, Vitest, @testing-library/react.

## Global Constraints

- El motor `src/engine/` y las capas `src/io`, `src/presets`, `src/validation`, `src/state` NO se modifican; se consumen vía sus barrels. `src/results/` sí se amplía (nuevos módulos puros); `src/ui/resultados/ResultadosModule.tsx` sí se modifica para integrar las gráficas.
- `src/results/` es PURO: sin React ni I/O; sólo importa del motor (`computeStations`, `resolveGuideline`, `evaluate`, `parseValue`, tipos) y sus propios módulos.
- Idioma español; todo en el navegador; tokens CSS de `src/App.css`; sin dependencias nuevas (gráficas SVG/CSS).
- Umbrales de color del mapa de calor (código del programa oficial): verde = cumple; gris = falla < 10×; amarillo = falla 10–25×; rojo = falla > 25× (el factor es valor/guía para máximos, guía/valor para mínimos).
- Las pruebas verifican comportamiento observable / valores concretos.

---

### Task 1: WQI por año (`computeYearlyWqi`)

**Files:**
- Create: `src/results/yearly.ts`
- Test: `src/results/yearly.test.ts`

**Interfaces:**
- Consumes: `computeStations` de `../engine`; `DataRow`, `GuidelineTable` de `../engine/types`.
- Produces:
  - `interface YearlyWqi { station: string; year: number; wqi: number }`
  - `computeYearlyWqi(rows: DataRow[], guidelines: GuidelineTable, options?: { hardnessCol?: string; phCol?: string; tempCol?: string }): YearlyWqi[]` — agrupa las filas por año (de `row.date`; filas sin fecha se ignoran), corre `computeStations` en cada subconjunto anual, y devuelve un punto por estación-año, ordenado por estación y año.

- [ ] **Step 1: Escribir la prueba que falla (`src/results/yearly.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { computeYearlyWqi } from './yearly'
import type { GuidelineTable, DataRow } from '../engine/types'

const gl: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])

describe('computeYearlyWqi', () => {
  it('produce un punto por estación y año', () => {
    const rows: DataRow[] = [
      { station: 'S1', date: new Date(2019, 0, 1), values: { TP: '0.02' } },
      { station: 'S1', date: new Date(2020, 0, 1), values: { TP: '0.10' } },
    ]
    const out = computeYearlyWqi(rows, gl)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ station: 'S1', year: 2019 })
    expect(out[1]).toMatchObject({ station: 'S1', year: 2020 })
    expect(out[0].wqi).toBeGreaterThan(out[1].wqi) // 2019 sin fallas > 2020 con falla
  })
  it('ignora filas sin fecha', () => {
    const rows: DataRow[] = [
      { station: 'S1', date: null, values: { TP: '0.02' } },
      { station: 'S1', date: new Date(2020, 0, 1), values: { TP: '0.02' } },
    ]
    const out = computeYearlyWqi(rows, gl)
    expect(out).toHaveLength(1)
    expect(out[0].year).toBe(2020)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/results/yearly.test.ts`
Expected: FAIL "Cannot find module './yearly'".

- [ ] **Step 3: Implementar `src/results/yearly.ts`**

```ts
import { computeStations } from '../engine'
import type { DataRow, GuidelineTable } from '../engine/types'

export interface YearlyWqi {
  station: string
  year: number
  wqi: number
}

export function computeYearlyWqi(
  rows: DataRow[],
  guidelines: GuidelineTable,
  options?: { hardnessCol?: string; phCol?: string; tempCol?: string },
): YearlyWqi[] {
  // Agrupar filas por año (ignorando las que no tienen fecha).
  const byYear = new Map<number, DataRow[]>()
  for (const r of rows) {
    if (!r.date) continue
    const y = r.date.getFullYear()
    const arr = byYear.get(y) ?? []
    arr.push(r)
    byYear.set(y, arr)
  }

  const out: YearlyWqi[] = []
  for (const [year, yearRows] of byYear) {
    for (const s of computeStations(yearRows, guidelines, options)) {
      out.push({ station: s.station, year, wqi: s.wqi })
    }
  }

  out.sort((a, b) => (a.station === b.station ? a.year - b.year : a.station < b.station ? -1 : 1))
  return out
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/results/yearly.test.ts`
Expected: PASS (2 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/results/yearly.ts src/results/yearly.test.ts
git commit -m "feat(results): WQI por ano y estacion (computeYearlyWqi)"
```

---

### Task 2: Excedencias por celda (`computeCells`)

**Files:**
- Create: `src/results/cells.ts`
- Test: `src/results/cells.test.ts`

**Interfaces:**
- Consumes: `parseValue`, `resolveGuideline`, `evaluate` de `../engine`; `DataRow`, `GuidelineTable`, `SampleContext` de `../engine/types`.
- Produces:
  - `type ExceedBand = 'pass' | 'lt10' | 'x10to25' | 'gt25' | 'na'`
  - `interface CellResult { station: string; date: Date | null; parameterId: string; raw: string; fail: boolean; ratio: number; band: ExceedBand }` (ratio = factor de exceso: `value/target` para máximos, `target/value` para mínimos; 1 si cumple; `band` según el factor: cumple→pass, <10→lt10, 10–25→x10to25, >25→gt25; `na` si no hay guía/valor).
  - `computeCells(rows: DataRow[], guidelines: GuidelineTable, options?: { hardnessCol?: string; phCol?: string; tempCol?: string }): CellResult[]` (una entrada por cada celda de parámetro con guía; omite celdas vacías).

- [ ] **Step 1: Escribir la prueba que falla (`src/results/cells.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { computeCells } from './cells'
import type { GuidelineTable, DataRow } from '../engine/types'

const gl: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])

describe('computeCells', () => {
  it('marca banda de cumplimiento y magnitud del exceso', () => {
    const rows: DataRow[] = [
      { station: 'S1', date: new Date(2020, 0, 1), values: { TP: '0.02' } }, // cumple
      { station: 'S1', date: new Date(2020, 1, 1), values: { TP: '0.10' } }, // 2x -> falla <10
      { station: 'S1', date: new Date(2020, 2, 1), values: { TP: '1.0' } },  // 20x -> 10-25
      { station: 'S1', date: new Date(2020, 3, 1), values: { TP: '2.0' } },  // 40x -> >25
    ]
    const cells = computeCells(rows, gl)
    expect(cells).toHaveLength(4)
    expect(cells[0]).toMatchObject({ fail: false, band: 'pass' })
    expect(cells[1]).toMatchObject({ fail: true, band: 'lt10' })
    expect(cells[2].band).toBe('x10to25')
    expect(cells[3].band).toBe('gt25')
  })
  it('omite celdas vacías y sin guía', () => {
    const rows: DataRow[] = [
      { station: 'S1', date: null, values: { TP: '', OTRO: '5' } },
    ]
    const cells = computeCells(rows, gl)
    expect(cells).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/results/cells.test.ts`
Expected: FAIL "Cannot find module './cells'".

- [ ] **Step 3: Implementar `src/results/cells.ts`**

```ts
import { parseValue, resolveGuideline, evaluate } from '../engine'
import type { DataRow, GuidelineTable, SampleContext } from '../engine/types'

export type ExceedBand = 'pass' | 'lt10' | 'x10to25' | 'gt25' | 'na'

export interface CellResult {
  station: string
  date: Date | null
  parameterId: string
  raw: string
  fail: boolean
  ratio: number
  band: ExceedBand
}

function bandFor(fail: boolean, ratio: number): ExceedBand {
  if (!fail) return 'pass'
  if (ratio < 10) return 'lt10'
  if (ratio <= 25) return 'x10to25'
  return 'gt25'
}

export function computeCells(
  rows: DataRow[],
  guidelines: GuidelineTable,
  options: { hardnessCol?: string; phCol?: string; tempCol?: string } = {},
): CellResult[] {
  const hardnessCol = options.hardnessCol ?? 'HARDNESS'
  const phCol = options.phCol ?? 'PH'
  const tempCol = options.tempCol ?? 'TEMP'

  const out: CellResult[] = []

  for (const r of rows) {
    const ctx: SampleContext = {
      hardness: parseValue(r.values[hardnessCol]).value,
      pH: parseValue(r.values[phCol]).value,
      temp: parseValue(r.values[tempCol]).value,
      date: r.date,
    }
    for (const [paramId, glRows] of guidelines) {
      const raw = r.values[paramId]
      const parsed = parseValue(raw)
      if (parsed.value == null) continue // celda vacía

      const resolved = resolveGuideline(glRows, ctx)
      if (resolved == null) continue // sin guía aplicable

      // Regla del límite de detección (igual que el motor): LD > guía-máximo => usa el LD como guía.
      let g = resolved
      if (parsed.nonDetect && resolved.mode === 'max' && typeof resolved.target === 'number' && parsed.value > resolved.target) {
        g = { target: parsed.value, mode: 'max' }
      }

      const { fail, excursion } = evaluate(parsed.value, g)
      const ratio = fail ? excursion + 1 : 1 // factor de exceso (excursión = factor − 1)
      out.push({
        station: r.station,
        date: r.date,
        parameterId: paramId,
        raw,
        fail,
        ratio,
        band: bandFor(fail, ratio),
      })
    }
  }

  return out
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/results/cells.test.ts`
Expected: PASS (2 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/results/cells.ts src/results/cells.test.ts
git commit -m "feat(results): excedencias por celda con bandas de magnitud (computeCells)"
```

---

### Task 3: Gráfica de tendencia (`TrendChart`)

**Files:**
- Create: `src/ui/resultados/TrendChart.tsx`
- Create: `src/ui/resultados/TrendChart.css`
- Test: `src/ui/resultados/TrendChart.test.tsx`

**Interfaces:**
- Consumes: `YearlyWqi` de `../../results/yearly`.
- Produces: `TrendChart({ data }: { data: YearlyWqi[] })` — una línea SVG por estación del WQI (eje Y 0–100) contra el año; si hay menos de 2 años en total, muestra un aviso "se necesitan al menos dos años".

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/resultados/TrendChart.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendChart } from './TrendChart'
import type { YearlyWqi } from '../../results/yearly'

describe('TrendChart', () => {
  it('avisa cuando hay menos de dos años', () => {
    const data: YearlyWqi[] = [{ station: 'S1', year: 2020, wqi: 80 }]
    render(<TrendChart data={data} />)
    expect(screen.getByText(/al menos dos años/i)).toBeInTheDocument()
  })
  it('dibuja la tendencia y lista las estaciones', () => {
    const data: YearlyWqi[] = [
      { station: 'S1', year: 2019, wqi: 90 },
      { station: 'S1', year: 2020, wqi: 40 },
    ]
    const { container } = render(<TrendChart data={data} />)
    expect(screen.getByText('S1')).toBeInTheDocument()
    expect(container.querySelector('polyline')).not.toBeNull()
    expect(screen.getByText('2019')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/resultados/TrendChart.test.tsx`
Expected: FAIL "Cannot find module './TrendChart'".

- [ ] **Step 3: Implementar `src/ui/resultados/TrendChart.tsx`**

```tsx
import type { YearlyWqi } from '../../results/yearly'
import './TrendChart.css'

const W = 520, H = 220, PAD = 34
const COLORS = ['#1f4e79', '#c0392b', '#1e8449', '#8e44ad', '#e67e22', '#0e7490']

export function TrendChart({ data }: { data: YearlyWqi[] }) {
  const years = [...new Set(data.map((d) => d.year))].sort((a, b) => a - b)
  if (years.length < 2) {
    return <p className="trend-empty">La tendencia necesita al menos dos años de datos.</p>
  }

  const stations = [...new Set(data.map((d) => d.station))].sort()
  const minY = years[0], maxY = years[years.length - 1]
  const x = (year: number) => PAD + ((year - minY) / (maxY - minY)) * (W - 2 * PAD)
  const y = (wqi: number) => H - PAD - (wqi / 100) * (H - 2 * PAD)

  return (
    <div className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Tendencia del WQI por año">
        {/* ejes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--line)" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--line)" />
        {[0, 50, 100].map((v) => (
          <text key={v} x={PAD - 6} y={y(v) + 4} textAnchor="end" className="trend-tick">{v}</text>
        ))}
        {years.map((yr) => (
          <text key={yr} x={x(yr)} y={H - PAD + 16} textAnchor="middle" className="trend-tick">{yr}</text>
        ))}
        {stations.map((st, i) => {
          const pts = data.filter((d) => d.station === st).sort((a, b) => a.year - b.year)
            .map((d) => `${x(d.year)},${y(d.wqi)}`).join(' ')
          return <polyline key={st} points={pts} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2" />
        })}
      </svg>
      <div className="trend-legend">
        {stations.map((st, i) => (
          <span key={st} className="trend-leg"><i style={{ background: COLORS[i % COLORS.length] }} />{st}</span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/resultados/TrendChart.css`**

```css
.trend { margin-top: 0.5rem; }
.trend-empty { color: var(--muted); }
.trend-tick { fill: var(--muted); font-size: 11px; }
.trend-legend { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; font-size: 0.85rem; color: var(--muted); }
.trend-leg { display: inline-flex; align-items: center; gap: 0.35rem; }
.trend-leg i { width: 0.8rem; height: 0.35rem; border-radius: 2px; display: inline-block; }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/resultados/TrendChart.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/ui/resultados/TrendChart.tsx src/ui/resultados/TrendChart.css src/ui/resultados/TrendChart.test.tsx
git commit -m "feat(ui): grafica de tendencia del WQI por ano"
```

---

### Task 4: Mapa de calor de excedencias (`Heatmap`)

**Files:**
- Create: `src/ui/resultados/Heatmap.tsx`
- Create: `src/ui/resultados/Heatmap.css`
- Test: `src/ui/resultados/Heatmap.test.tsx`

**Interfaces:**
- Consumes: `CellResult`, `ExceedBand` de `../../results/cells`.
- Produces: `Heatmap({ cells }: { cells: CellResult[] })` — una cuadrícula parámetro (filas) × fecha (columnas) donde cada celda se colorea por su `band` (verde/gris/amarillo/rojo); incluye una leyenda. Si no hay celdas, muestra un aviso.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/resultados/Heatmap.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heatmap } from './Heatmap'
import type { CellResult } from '../../results/cells'

const cells: CellResult[] = [
  { station: 'S1', date: new Date(2020, 0, 1), parameterId: 'TP', raw: '0.02', fail: false, ratio: 1, band: 'pass' },
  { station: 'S1', date: new Date(2020, 1, 1), parameterId: 'TP', raw: '0.10', fail: true, ratio: 2, band: 'lt10' },
]

describe('Heatmap', () => {
  it('avisa cuando no hay celdas', () => {
    render(<Heatmap cells={[]} />)
    expect(screen.getByText(/sin datos/i)).toBeInTheDocument()
  })
  it('muestra el parámetro y una celda por fecha con su color de banda', () => {
    const { container } = render(<Heatmap cells={cells} />)
    expect(screen.getByText('TP')).toBeInTheDocument()
    expect(container.querySelectorAll('.hm-cell').length).toBe(2)
    expect(container.querySelector('.hm-cell.band-lt10')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/resultados/Heatmap.test.tsx`
Expected: FAIL "Cannot find module './Heatmap'".

- [ ] **Step 3: Implementar `src/ui/resultados/Heatmap.tsx`**

```tsx
import type { CellResult } from '../../results/cells'
import './Heatmap.css'

function fmtDate(d: Date | null): string {
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '—'
}

export function Heatmap({ cells }: { cells: CellResult[] }) {
  if (cells.length === 0) return <p className="hm-empty">Sin datos para el mapa de excedencias.</p>

  const params = [...new Set(cells.map((c) => c.parameterId))].sort()
  const dates = [...new Set(cells.map((c) => fmtDate(c.date)))].sort()
  const byKey = new Map(cells.map((c) => [`${c.parameterId}|${fmtDate(c.date)}`, c]))

  return (
    <div className="hm">
      <div className="hm-scroll">
        <table className="hm-table">
          <thead>
            <tr>
              <th></th>
              {dates.map((d) => <th key={d} className="hm-date">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {params.map((p) => (
              <tr key={p}>
                <th className="hm-param">{p}</th>
                {dates.map((d) => {
                  const c = byKey.get(`${p}|${d}`)
                  const band = c ? c.band : 'na'
                  const title = c ? `${p} · ${d}: ${c.raw}${c.fail ? ` (×${c.ratio.toFixed(1)})` : ''}` : ''
                  return <td key={d} className={`hm-cell band-${band}`} title={title} />
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hm-legend">
        <span><i className="band-pass" /> Cumple</span>
        <span><i className="band-lt10" /> Falla &lt;10×</span>
        <span><i className="band-x10to25" /> 10–25×</span>
        <span><i className="band-gt25" /> &gt;25×</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/resultados/Heatmap.css`**

```css
.hm { margin-top: 0.5rem; }
.hm-scroll { overflow-x: auto; }
.hm-table { border-collapse: collapse; }
.hm-date { font-size: 0.7rem; color: var(--muted); font-weight: 500; padding: 0 2px; writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; }
.hm-param { text-align: right; font-size: 0.8rem; color: var(--text); font-weight: 600; padding-right: 0.5rem; white-space: nowrap; }
.hm-cell { width: 16px; height: 16px; border: 1px solid var(--bg); }
.band-pass { background: #1e8449; }
.band-lt10 { background: #9aa0a6; }
.band-x10to25 { background: #f1c40f; }
.band-gt25 { background: #c0392b; }
.band-na { background: transparent; }
.hm-legend { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.6rem; font-size: 0.82rem; color: var(--muted); }
.hm-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
.hm-legend i { width: 0.8rem; height: 0.8rem; border-radius: 3px; display: inline-block; }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/resultados/Heatmap.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/ui/resultados/Heatmap.tsx src/ui/resultados/Heatmap.css src/ui/resultados/Heatmap.test.tsx
git commit -m "feat(ui): mapa de calor de excedencias parametro x fecha"
```

---

### Task 5: Integrar tendencia y mapa en el Módulo Resultados

**Files:**
- Modify: `src/ui/resultados/ResultadosModule.tsx`
- Modify: `src/ui/resultados/ResultadosModule.css`
- Test: `src/ui/resultados/ResultadosModule.test.tsx` (agregar prueba; no quitar las existentes)

**Interfaces:**
- Consumes: además de lo actual, `computeYearlyWqi` de `../../results/yearly`; `computeCells` de `../../results/cells`; `TrendChart`, `Heatmap`.
- Produces: el `ResultadosModule` muestra, debajo de las tarjetas por estación, dos secciones tituladas "Tendencia por año" (con `<TrendChart>`) y "Mapa de excedencias" (con `<Heatmap>`), calculadas en `useMemo`.

- [ ] **Step 1: Leer el archivo actual y agregar la prueba que falla**

Lee `src/ui/resultados/ResultadosModule.test.tsx`. Agrega, dentro del `describe` existente y reutilizando el patrón `Seed` de la segunda prueba, esta prueba (que carga datos de dos años para que aparezca la tendencia):

```tsx
  it('muestra las secciones de tendencia y mapa de excedencias', async () => {
    const table: import('../../engine/types').GuidelineTable = new Map([
      ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
    ])
    const rows: import('../../engine/types').DataRow[] = [
      { station: 'S1', date: new Date(2019, 0, 1), values: { TP: '0.02' } },
      { station: 'S1', date: new Date(2020, 0, 1), values: { TP: '0.10' } },
    ]
    render(
      <ProjectProvider>
        <Seed table={table} rows={rows} columns={['TP']} />
        <ResultadosModule />
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByText('seed'))
    expect(screen.getByRole('heading', { name: /Tendencia por año/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Mapa de excedencias/i })).toBeInTheDocument()
  })
```

(Nota: la segunda prueba existente ya define un componente `Seed`; si `Seed` está declarado dentro de esa prueba y no es reutilizable, declara uno equivalente a nivel de archivo o dentro de la nueva prueba, con la misma forma: despacha `loadGuideline` y `loadData`.)

- [ ] **Step 2: Correr y verificar que la nueva falla**

Run: `npm test -- src/ui/resultados/ResultadosModule.test.tsx`
Expected: FAIL en la prueba nueva (no existen los encabezados de tendencia/mapa).

- [ ] **Step 3: Modificar `src/ui/resultados/ResultadosModule.tsx`**

Agrega los imports:

```tsx
import { computeYearlyWqi } from '../../results/yearly'
import { computeCells } from '../../results/cells'
import { TrendChart } from './TrendChart'
import { Heatmap } from './Heatmap'
```

Dentro del componente, después del `useMemo` de `results`, agrega dos memos más:

```tsx
  const yearly = useMemo(
    () => (state.data && state.guideline ? computeYearlyWqi(state.data, state.guideline) : []),
    [state.data, state.guideline],
  )
  const cells = useMemo(
    () => (state.data && state.guideline ? computeCells(state.data, state.guideline) : []),
    [state.data, state.guideline],
  )
```

Y dentro del `return`, después del `<div className="res-grid">…</div>` que lista las tarjetas, agrega:

```tsx
      <div className="res-chart">
        <h3>Tendencia por año</h3>
        <TrendChart data={yearly} />
      </div>
      <div className="res-chart">
        <h3>Mapa de excedencias</h3>
        <Heatmap cells={cells} />
      </div>
```

- [ ] **Step 4: Agregar estilos a `src/ui/resultados/ResultadosModule.css`**

Añade al final:

```css
.res-chart { margin-top: 1.75rem; }
.res-chart h3 { color: var(--accent); font-size: 1.05rem; margin: 0 0 0.5rem; }
```

- [ ] **Step 5: Correr la prueba, TODA la suite y el build**

Run: `npm test -- src/ui/resultados/ResultadosModule.test.tsx`
Expected: PASS (las existentes + la nueva).

Run: `npm test`
Expected: PASS en todos los archivos.

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 6: Commit**

```bash
git add src/ui/resultados/ResultadosModule.tsx src/ui/resultados/ResultadosModule.css src/ui/resultados/ResultadosModule.test.tsx
git commit -m "feat(ui): integrar tendencia por ano y mapa de excedencias en Resultados"
```

---

## Self-Review

**1. Cobertura del spec (§8 gráficas b y d):**
- Tendencia temporal (WQI por año, por estación) → Tasks 1, 3, 5. ✅
- Mapa de calor de excedencias (parámetro × fecha, bandas <10×/10–25×/>25×) → Tasks 2, 4, 5. ✅
- Reutiliza `computeStations`/`resolveGuideline`/`evaluate`/`parseValue` sin modificar el motor. ✅

**2. Placeholders:** ninguno; todo el código está completo.

**3. Consistencia de tipos:** `YearlyWqi` (Task 1) usado por `TrendChart` (Task 3) y `ResultadosModule` (Task 5); `CellResult`/`ExceedBand` (Task 2) usados por `Heatmap` (Task 4) y el módulo; las bandas del mapa (`pass/lt10/x10to25/gt25`) coinciden entre `cells.ts` (clases `band-*`) y el CSS de `Heatmap`.

**Fuera de alcance (fases siguientes):** selección de periodo 1/3/todos los años (el WQI principal sigue agregando todo; la tendencia ya da el corte anual); exportación a PDF/PNG; asistente de alta de parámetros (Fase 3B); autoguardado/`.ica.json` (Fase 7).
