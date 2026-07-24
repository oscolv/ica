# Fase 5A — Módulo Resultados (núcleo) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calcular el CCME WQI de punta a punta (guía + datos → motor) y comunicarlo: una tarjeta por estación con gauge, categoría en español y narrativa automática, la descomposición F1/F2/F3, y exportación CSV de resultados.

**Architecture:** Una capa pura `src/results/` (etiquetas de categoría, narrativa, serialización CSV) sin dependencias de UI, y componentes React en `src/ui/resultados/` que consumen el motor `computeStations` (Fase 1) sobre el estado del `ProjectStore` (guía + datos de Fases 3A/4). Las gráficas se dibujan con SVG/CSS ligero, sin librerías nuevas. Se monta en el paso `resultados` del `AppShell`.

**Tech Stack:** React, Vite, TypeScript, Vitest, @testing-library/react.

## Global Constraints

- El motor `src/engine/` y las capas `src/io`, `src/presets`, `src/validation`, `src/state` NO se modifican; se consumen vía sus módulos (`computeStations` y los tipos desde el barrel `src/engine` / `src/engine/types`).
- `src/results/` es una capa PURA: sin React ni librerías de I/O; sólo importa tipos del motor y sus propios módulos.
- Idioma del producto: español. Todo en el navegador; sin red. Diseño responsivo y compatible con tema claro/oscuro reutilizando los tokens CSS de `src/App.css` (`--bg`, `--card`, `--line`, `--text`, `--muted`, `--accent`, `--accent2`).
- Sin dependencias nuevas: las gráficas son SVG/CSS.
- El cálculo agrega por estación sobre TODAS las filas del dataset (la selección de periodo 1/3/todos los años se difiere a la Fase 5B).
- Las pruebas de componentes verifican comportamiento observable.

---

### Task 1: Categoría — etiqueta en español y color (`categoryInfo`)

**Files:**
- Create: `src/results/categoryInfo.ts`
- Test: `src/results/categoryInfo.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `categoryLabelEs(category: string): string` (Excellent→Excelente, Good→Buena, Fair→Regular, Marginal→Marginal, Poor→Mala).
  - `categoryColor(category: string): string` (hex por categoría).

- [ ] **Step 1: Escribir la prueba que falla (`src/results/categoryInfo.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { categoryLabelEs, categoryColor } from './categoryInfo'

describe('categoryInfo', () => {
  it('traduce las categorías al español', () => {
    expect(categoryLabelEs('Excellent')).toBe('Excelente')
    expect(categoryLabelEs('Good')).toBe('Buena')
    expect(categoryLabelEs('Fair')).toBe('Regular')
    expect(categoryLabelEs('Marginal')).toBe('Marginal')
    expect(categoryLabelEs('Poor')).toBe('Mala')
  })
  it('asigna un color por categoría', () => {
    expect(categoryColor('Excellent')).toBe('#1E8449')
    expect(categoryColor('Poor')).toBe('#C0392B')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/results/categoryInfo.test.ts`
Expected: FAIL "Cannot find module './categoryInfo'".

- [ ] **Step 3: Implementar `src/results/categoryInfo.ts`**

```ts
export function categoryLabelEs(category: string): string {
  switch (category) {
    case 'Excellent': return 'Excelente'
    case 'Good': return 'Buena'
    case 'Fair': return 'Regular'
    case 'Marginal': return 'Marginal'
    default: return 'Mala' // Poor
  }
}

export function categoryColor(category: string): string {
  switch (category) {
    case 'Excellent': return '#1E8449'
    case 'Good': return '#27AE60'
    case 'Fair': return '#F1C40F'
    case 'Marginal': return '#E67E22'
    default: return '#C0392B' // Poor
  }
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/results/categoryInfo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/results/categoryInfo.ts src/results/categoryInfo.test.ts
git commit -m "feat(results): etiqueta de categoria en espanol y color"
```

---

### Task 2: Narrativa automática (`buildNarrative`)

**Files:**
- Create: `src/results/narrative.ts`
- Test: `src/results/narrative.test.ts`

**Interfaces:**
- Consumes: `StationResult` de `../engine/types`; `categoryLabelEs` de `./categoryInfo`.
- Produces: `buildNarrative(r: StationResult): string` — frase en español con la categoría, el valor y los parámetros que fallan.

- [ ] **Step 1: Escribir la prueba que falla (`src/results/narrative.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { buildNarrative } from './narrative'
import type { StationResult } from '../engine/types'

const base: StationResult = {
  station: 'S1', nParams: 10, nTests: 100, failedParams: [], nFailedTests: 0,
  f1: 0, f2: 0, f3: 0, nse: 0, wqi: 96, category: 'Excellent',
}

describe('buildNarrative', () => {
  it('describe un caso sin fallas', () => {
    const t = buildNarrative(base)
    expect(t).toContain('S1')
    expect(t.toLowerCase()).toContain('excelente')
    expect(t).toMatch(/Ning[uú]n par[aá]metro/i)
  })
  it('describe los parámetros que fallan', () => {
    const r: StationResult = { ...base, failedParams: ['ALUMINUM', 'IRON'], nFailedTests: 8, wqi: 41, category: 'Poor' }
    const t = buildNarrative(r)
    expect(t.toLowerCase()).toContain('mala')
    expect(t).toContain('ALUMINUM')
    expect(t).toContain('IRON')
    expect(t).toContain('41')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/results/narrative.test.ts`
Expected: FAIL "Cannot find module './narrative'".

- [ ] **Step 3: Implementar `src/results/narrative.ts`**

```ts
import type { StationResult } from '../engine/types'
import { categoryLabelEs } from './categoryInfo'

export function buildNarrative(r: StationResult): string {
  const cat = categoryLabelEs(r.category).toLowerCase()
  const base = `La calidad del agua en ${r.station} es ${cat} (WQI ${r.wqi.toFixed(0)}).`
  if (r.failedParams.length === 0) {
    return `${base} Ningún parámetro incumplió su guía en el periodo evaluado.`
  }
  const params = r.failedParams.join(', ')
  return `${base} ${r.failedParams.length} de ${r.nParams} parámetros incumplieron su guía (${params}), en ${r.nFailedTests} de ${r.nTests} pruebas.`
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/results/narrative.test.ts`
Expected: PASS (2 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/results/narrative.ts src/results/narrative.test.ts
git commit -m "feat(results): narrativa automatica en espanol por estacion"
```

---

### Task 3: Serialización de resultados a CSV (`resultsToCsv`)

**Files:**
- Create: `src/results/resultsCsv.ts`
- Test: `src/results/resultsCsv.test.ts`

**Interfaces:**
- Consumes: `StationResult` de `../engine/types`.
- Produces: `resultsToCsv(results: StationResult[]): string` — encabezado + una fila por estación.

- [ ] **Step 1: Escribir la prueba que falla (`src/results/resultsCsv.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { resultsToCsv } from './resultsCsv'
import type { StationResult } from '../engine/types'

const r: StationResult = {
  station: 'S1', nParams: 20, nTests: 253, failedParams: ['AL', 'FE'], nFailedTests: 39,
  f1: 20, f2: 15.4, f3: 98.88, nse: 88, wqi: 41.1, category: 'Poor',
}

describe('resultsToCsv', () => {
  it('genera encabezado y una fila por estación', () => {
    const csv = resultsToCsv([r])
    const lines = csv.trim().split('\n')
    expect(lines[0]).toContain('Station')
    expect(lines[0]).toContain('WQI')
    expect(lines[1]).toContain('S1')
    expect(lines[1]).toContain('41.1')
    expect(lines[1]).toContain('Poor')
    expect(lines[1]).toContain('AL; FE')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/results/resultsCsv.test.ts`
Expected: FAIL "Cannot find module './resultsCsv'".

- [ ] **Step 3: Implementar `src/results/resultsCsv.ts`**

```ts
import type { StationResult } from '../engine/types'

const HEADER =
  'Station,WQI,Categoria,F1,F2,F3,nse,ParametrosTotales,PruebasTotales,PruebasFallidas,ParametrosQueFallan'

function rowToCsv(r: StationResult): string {
  return [
    `"${r.station}"`,
    r.wqi.toFixed(1),
    r.category,
    r.f1.toFixed(1),
    r.f2.toFixed(1),
    r.f3.toFixed(2),
    r.nse.toFixed(4),
    r.nParams,
    r.nTests,
    r.nFailedTests,
    `"${r.failedParams.join('; ')}"`,
  ].join(',')
}

export function resultsToCsv(results: StationResult[]): string {
  return [HEADER, ...results.map(rowToCsv)].join('\n') + '\n'
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/results/resultsCsv.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/results/resultsCsv.ts src/results/resultsCsv.test.ts
git commit -m "feat(results): exportar resultados por estacion a CSV"
```

---

### Task 4: Tarjeta con gauge (`GaugeCard`)

**Files:**
- Create: `src/ui/resultados/GaugeCard.tsx`
- Create: `src/ui/resultados/GaugeCard.css`
- Test: `src/ui/resultados/GaugeCard.test.tsx`

**Interfaces:**
- Consumes: `StationResult` de `../../engine/types`; `categoryLabelEs`, `categoryColor` de `../../results/categoryInfo`; `buildNarrative` de `../../results/narrative`.
- Produces: `GaugeCard({ result }: { result: StationResult })` — un medidor semicircular SVG (0–100) coloreado por categoría, el valor, la categoría en español y la narrativa.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/resultados/GaugeCard.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GaugeCard } from './GaugeCard'
import type { StationResult } from '../../engine/types'

const r: StationResult = {
  station: 'Station1', nParams: 20, nTests: 253, failedParams: ['ALUMINUM'], nFailedTests: 39,
  f1: 20, f2: 15.4, f3: 98.9, nse: 88, wqi: 41, category: 'Poor',
}

describe('GaugeCard', () => {
  it('muestra estación, valor, categoría y narrativa', () => {
    render(<GaugeCard result={r} />)
    expect(screen.getByText('Station1')).toBeInTheDocument()
    expect(screen.getByText('41')).toBeInTheDocument()
    expect(screen.getByText('Mala')).toBeInTheDocument()
    expect(screen.getByText(/incumplieron su guía/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/resultados/GaugeCard.test.tsx`
Expected: FAIL "Cannot find module './GaugeCard'".

- [ ] **Step 3: Implementar `src/ui/resultados/GaugeCard.tsx`**

```tsx
import type { StationResult } from '../../engine/types'
import { categoryLabelEs, categoryColor } from '../../results/categoryInfo'
import { buildNarrative } from '../../results/narrative'
import './GaugeCard.css'

// Medidor semicircular: arco de (20,100) a (180,100), radio 80.
const ARC = 'M 20 100 A 80 80 0 0 1 180 100'
const CIRC = Math.PI * 80 // longitud del semicírculo

export function GaugeCard({ result }: { result: StationResult }) {
  const color = categoryColor(result.category)
  const pct = Math.max(0, Math.min(100, result.wqi))
  const offset = CIRC * (1 - pct / 100)

  return (
    <article className="gcard">
      <h3 className="gcard-station">{result.station}</h3>
      <div className="gcard-gauge">
        <svg viewBox="0 0 200 120" width="200" height="120" role="img" aria-label={`WQI ${result.wqi.toFixed(0)}, ${categoryLabelEs(result.category)}`}>
          <path d={ARC} fill="none" stroke="var(--line)" strokeWidth="14" strokeLinecap="round" />
          <path d={ARC} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset} />
          <text x="100" y="94" textAnchor="middle" className="gcard-value" fill={color}>{result.wqi.toFixed(0)}</text>
        </svg>
      </div>
      <div className="gcard-cat" style={{ color }}>{categoryLabelEs(result.category)}</div>
      <p className="gcard-narrative">{buildNarrative(result)}</p>
    </article>
  )
}
```

- [ ] **Step 4: Crear `src/ui/resultados/GaugeCard.css`**

```css
.gcard {
  background: var(--card); border: 1px solid var(--line); border-radius: 14px;
  padding: 1.2rem; display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
}
.gcard-station { margin: 0; font-size: 1.05rem; color: var(--muted); font-weight: 600; }
.gcard-gauge { line-height: 0; }
.gcard-value { font-size: 2rem; font-weight: 800; }
.gcard-cat { font-size: 1.25rem; font-weight: 700; margin-top: -0.5rem; }
.gcard-narrative { color: var(--muted); font-size: 0.9rem; line-height: 1.5; margin: 0.4rem 0 0; text-align: left; }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/resultados/GaugeCard.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/resultados/GaugeCard.tsx src/ui/resultados/GaugeCard.css src/ui/resultados/GaugeCard.test.tsx
git commit -m "feat(ui): tarjeta con gauge, categoria y narrativa por estacion"
```

---

### Task 5: Descomposición de factores (`FactorBars`)

**Files:**
- Create: `src/ui/resultados/FactorBars.tsx`
- Create: `src/ui/resultados/FactorBars.css`
- Test: `src/ui/resultados/FactorBars.test.tsx`

**Interfaces:**
- Consumes: `StationResult` de `../../engine/types`.
- Produces: `FactorBars({ result }: { result: StationResult })` — tres barras (F1 alcance, F2 frecuencia, F3 amplitud) con su valor.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/resultados/FactorBars.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FactorBars } from './FactorBars'
import type { StationResult } from '../../engine/types'

const r: StationResult = {
  station: 'S1', nParams: 20, nTests: 253, failedParams: [], nFailedTests: 39,
  f1: 20, f2: 15.4, f3: 98.9, nse: 88, wqi: 41, category: 'Poor',
}

describe('FactorBars', () => {
  it('muestra los tres factores con sus valores', () => {
    render(<FactorBars result={r} />)
    expect(screen.getByText(/Alcance/i)).toBeInTheDocument()
    expect(screen.getByText(/Frecuencia/i)).toBeInTheDocument()
    expect(screen.getByText(/Amplitud/i)).toBeInTheDocument()
    expect(screen.getByText('20.0')).toBeInTheDocument()
    expect(screen.getByText('98.9')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/resultados/FactorBars.test.tsx`
Expected: FAIL "Cannot find module './FactorBars'".

- [ ] **Step 3: Implementar `src/ui/resultados/FactorBars.tsx`**

```tsx
import type { StationResult } from '../../engine/types'
import './FactorBars.css'

export function FactorBars({ result }: { result: StationResult }) {
  const factors = [
    { key: 'F1', label: 'F1 · Alcance', value: result.f1 },
    { key: 'F2', label: 'F2 · Frecuencia', value: result.f2 },
    { key: 'F3', label: 'F3 · Amplitud', value: result.f3 },
  ]
  return (
    <div className="fbars">
      {factors.map((f) => (
        <div key={f.key} className="fbar-row">
          <span className="fbar-label">{f.label}</span>
          <div className="fbar-track">
            <div className="fbar-fill" style={{ width: `${Math.max(0, Math.min(100, f.value))}%` }} />
          </div>
          <span className="fbar-val">{f.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/resultados/FactorBars.css`**

```css
.fbars { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }
.fbar-row { display: grid; grid-template-columns: 8rem 1fr 3rem; align-items: center; gap: 0.6rem; font-size: 0.88rem; }
.fbar-label { color: var(--muted); }
.fbar-track { background: var(--line); border-radius: 999px; height: 0.6rem; overflow: hidden; }
.fbar-fill { background: linear-gradient(90deg, var(--accent), var(--accent2)); height: 100%; }
.fbar-val { text-align: right; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/resultados/FactorBars.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/resultados/FactorBars.tsx src/ui/resultados/FactorBars.css src/ui/resultados/FactorBars.test.tsx
git commit -m "feat(ui): descomposicion de factores F1/F2/F3 por estacion"
```

---

### Task 6: Ensamblar el Módulo Resultados + montar en el shell

**Files:**
- Create: `src/ui/resultados/ResultadosModule.tsx`
- Create: `src/ui/resultados/ResultadosModule.css`
- Modify: `src/App.tsx`
- Test: `src/ui/resultados/ResultadosModule.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `computeStations` de `../../engine`; `resultsToCsv` de `../../results/resultsCsv`; `GaugeCard`, `FactorBars`.
- Produces: `ResultadosModule` — si falta guía o datos, muestra un aviso; si hay ambos, corre `computeStations` (en `useMemo`), muestra una tarjeta (gauge + factores) por estación y un botón "Descargar CSV". Se monta en el paso `resultados` del `AppShell`.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/resultados/ResultadosModule.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { ResultadosModule } from './ResultadosModule'
import type { GuidelineTable, DataRow } from '../../engine/types'

function Seed({ table, rows, columns }: { table: GuidelineTable; rows: DataRow[]; columns: string[] }) {
  const { dispatch } = useProject()
  function go() {
    dispatch({ type: 'loadGuideline', table, name: 'g' })
    dispatch({ type: 'loadData', rows, columns, name: 'd.csv' })
  }
  return <button onClick={go}>seed</button>
}

describe('ResultadosModule', () => {
  it('pide cargar guía y datos si faltan', () => {
    render(<ProjectProvider><ResultadosModule /></ProjectProvider>)
    expect(screen.getByText(/carga una guía/i)).toBeInTheDocument()
  })
  it('calcula y muestra el WQI por estación con botón de descarga', async () => {
    const table: GuidelineTable = new Map([
      ['DO', [{ parameterId: 'DO', ruleType: 'min', lowerLimit: 5, upperLimit: null, unit: 'mg/L' }]],
      ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
    ])
    const rows: DataRow[] = [
      { station: 'S1', date: new Date(2020, 0, 1), values: { DO: '6', TP: '0.10' } },
      { station: 'S1', date: new Date(2020, 1, 1), values: { DO: '4', TP: '0.02' } },
    ]
    render(
      <ProjectProvider>
        <Seed table={table} rows={rows} columns={['DO', 'TP']} />
        <ResultadosModule />
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByText('seed'))
    expect(screen.getByText('S1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar csv/i })).toBeInTheDocument()
    // WQI ~34 para este caso conocido (ver motor); basta con que aparezca la tarjeta
    expect(screen.getByText(/Alcance/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/resultados/ResultadosModule.test.tsx`
Expected: FAIL "Cannot find module './ResultadosModule'".

- [ ] **Step 3: Implementar `src/ui/resultados/ResultadosModule.tsx`**

```tsx
import { useMemo } from 'react'
import { useProject } from '../../state/ProjectContext'
import { computeStations } from '../../engine'
import { resultsToCsv } from '../../results/resultsCsv'
import { GaugeCard } from './GaugeCard'
import { FactorBars } from './FactorBars'
import './ResultadosModule.css'

export function ResultadosModule() {
  const { state } = useProject()
  const results = useMemo(() => {
    if (!state.data || !state.guideline) return null
    return computeStations(state.data, state.guideline)
  }, [state.data, state.guideline])

  if (!state.guideline || !state.data) {
    return <p className="res-empty">Carga una guía (paso ①) y tus datos (paso ②) para calcular el WQI.</p>
  }
  if (!results || results.length === 0) {
    return <p className="res-empty">No se pudo calcular el WQI con la guía y los datos actuales.</p>
  }

  function download() {
    const csv = resultsToCsv(results!)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resultados-wqi.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <section className="resultados">
      <div className="res-bar">
        <h2>Resultados del WQI</h2>
        <button className="res-btn" onClick={download}>Descargar CSV</button>
      </div>
      <div className="res-grid">
        {results.map((r) => (
          <div key={r.station} className="res-station">
            <GaugeCard result={r} />
            <FactorBars result={r} />
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Crear `src/ui/resultados/ResultadosModule.css`**

```css
.res-empty { color: var(--muted); padding: 1.5rem 0; }
.res-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.res-bar h2 { font-size: 1.2rem; margin: 0; }
.res-btn {
  background: var(--accent); color: #fff; border: none; border-radius: 8px;
  padding: 0.5rem 0.9rem; cursor: pointer; font: inherit; font-weight: 600;
}
.res-btn:hover { filter: brightness(1.08); }
.res-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.res-station { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 0.5rem 1rem 1.2rem; }
.res-station .gcard { border: none; background: none; padding: 0.6rem 0; }
```

- [ ] **Step 5: Montar el módulo en el shell (`src/App.tsx`)**

Reemplaza el contenido por:

```tsx
import { AppShell } from './ui/AppShell'
import { GuiasModule } from './ui/guias/GuiasModule'
import { DatosModule } from './ui/datos/DatosModule'
import { ResultadosModule } from './ui/resultados/ResultadosModule'
import './App.css'

function App() {
  return (
    <AppShell
      steps={{
        guias: <GuiasModule />,
        datos: <DatosModule />,
        resultados: <ResultadosModule />,
      }}
    />
  )
}

export default App
```

- [ ] **Step 6: Correr la prueba, TODA la suite y el build**

Run: `npm test -- src/ui/resultados/ResultadosModule.test.tsx`
Expected: PASS (2 pruebas).

Run: `npm test`
Expected: PASS en todos los archivos (motor + io + presets + validación + results + ui).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 7: Commit**

```bash
git add src/ui/resultados/ResultadosModule.tsx src/ui/resultados/ResultadosModule.css src/App.tsx src/ui/resultados/ResultadosModule.test.tsx
git commit -m "feat(ui): ensamblar Modulo Resultados (WQI de punta a punta) y montarlo"
```

---

## Self-Review

**1. Cobertura del spec (§8 Módulo Resultados, núcleo):**
- Cálculo de punta a punta (guía + datos → `computeStations`) → Task 6. ✅
- Tarjeta por estación: gauge 0–100 + color de categoría + valor + narrativa en español → Tasks 1, 2, 4. ✅
- Descomposición F1/F2/F3 → Task 5. ✅
- Exportación CSV de resultados → Tasks 3, 6. ✅
- Montado en el paso Resultados del shell → Task 6. ✅
- Reutiliza el motor `computeStations` (validado, WQI del manual = 88) sin modificarlo. ✅

**2. Placeholders:** ninguno; todo el código (TS/TSX/CSS) está completo.

**3. Consistencia de tipos:** `StationResult` (del motor) se consume en `categoryInfo`/`narrative`/`resultsCsv` y en los componentes con la misma forma; `computeStations(rows, guideline)` se llama con `state.data`/`state.guideline` del store; `categoryLabelEs`/`categoryColor`/`buildNarrative`/`resultsToCsv` se consumen con sus firmas.

**Fuera de alcance (Fase 5B y siguientes):** tendencia temporal (WQI por año/periodo — requiere filtrar por año y un selector de periodo) y mapa de calor de excedencias (parámetro × fecha con el código <10×/10–25×/>25× — requiere exponer las excursiones por celda desde el motor); exportación a PDF/PNG; Ayuda (Fase 6); autoguardado/`.ica.json` (Fase 7); asistente de alta de parámetros en Guías (Fase 3B); mapeo manual de columnas y avisos de parseo no fatales (pulido Fase 4).
