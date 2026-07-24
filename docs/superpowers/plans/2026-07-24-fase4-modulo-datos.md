# Fase 4 — Módulo Datos · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el Módulo ② Datos: subir datos de monitoreo (CSV/Excel), previsualizarlos y validarlos de forma cruzada contra la guía activa, con una compuerta "listo para calcular".

**Architecture:** Se extiende el `ProjectStore` para guardar el dataset (filas + columnas + nombre). El módulo reutiliza `src/io/parseData` (parseo), `src/io/readExcel` (Excel) y `src/validation/validateData` (validación cruzada) de la Fase 2, y se monta en el paso `datos` del `AppShell`. Componentes React enfocados: entrada, vista previa y panel de validación.

**Tech Stack:** React, Vite, TypeScript, Vitest, @testing-library/react.

## Global Constraints

- El motor `src/engine/` y las capas `src/io`, `src/presets`, `src/validation` NO se modifican; se consumen vía sus módulos.
- Esta fase SÍ extiende el estado (`src/state/projectReducer.ts` + su prueba) de forma intencional: agrega el dataset. No modifica otra cosa del estado.
- Idioma del producto: español. Todo en el navegador; sin red. Diseño responsivo y compatible con tema claro/oscuro reutilizando los tokens CSS de `src/App.css` (`--bg`, `--card`, `--line`, `--text`, `--muted`, `--accent`, `--accent2`).
- Las pruebas de componentes verifican comportamiento observable.
- Las tablas anchas scrollean dentro de su contenedor (`overflow-x: auto`), no rompen el layout.

---

### Task 1: Extender el estado con el dataset

**Files:**
- Modify: `src/state/projectReducer.ts`
- Test: `src/state/projectReducer.test.ts` (agregar pruebas; no quitar las existentes)

**Interfaces:**
- Consumes: `DataRow`, `GuidelineTable`, `GuidelineRow` de `../engine/types`.
- Produces (ampliación):
  - `ProjectState` ahora incluye `data: DataRow[] | null`, `dataColumns: string[]`, `dataName: string`.
  - `ProjectAction` incluye `{ type: 'loadData'; rows: DataRow[]; columns: string[]; name: string }` y `{ type: 'clearData' }`.

- [ ] **Step 1: Agregar las pruebas nuevas (`src/state/projectReducer.test.ts`)**

Agrega estas pruebas dentro del `describe('projectReducer', ...)` existente (NO borres las que ya están):

```ts
  it('loadData guarda filas, columnas y nombre sin borrar la guía', () => {
    const withGl = projectReducer(initialState, { type: 'loadGuideline', table: table([row({ parameterId: 'AS', upperLimit: 5 })]), name: 'CCME' })
    const s = projectReducer(withGl, { type: 'loadData', rows: [{ station: 'S1', date: null, values: { AS: '1' } }], columns: ['AS'], name: 'datos.csv' })
    expect(s.dataName).toBe('datos.csv')
    expect(s.data!).toHaveLength(1)
    expect(s.dataColumns).toEqual(['AS'])
    expect(s.guidelineName).toBe('CCME') // la guía se conserva
  })
  it('clearData borra el dataset pero conserva la guía', () => {
    const withGl = projectReducer(initialState, { type: 'loadGuideline', table: table([row({ parameterId: 'AS', upperLimit: 5 })]), name: 'CCME' })
    const withData = projectReducer(withGl, { type: 'loadData', rows: [{ station: 'S1', date: null, values: { AS: '1' } }], columns: ['AS'], name: 'd.csv' })
    const s = projectReducer(withData, { type: 'clearData' })
    expect(s.data).toBeNull()
    expect(s.dataColumns).toEqual([])
    expect(s.guideline).not.toBeNull()
  })
```

- [ ] **Step 2: Correr y verificar que las nuevas fallan**

Run: `npm test -- src/state/projectReducer.test.ts`
Expected: FAIL en las dos pruebas nuevas (acciones `loadData`/`clearData` aún no existen; el estado no tiene `data`).

- [ ] **Step 3: Reemplazar `src/state/projectReducer.ts`**

Reemplaza TODO el contenido del archivo por esta versión (que añade el dataset y preserva la lógica de guías):

```ts
import type { GuidelineTable, GuidelineRow, DataRow } from '../engine/types'

export interface ProjectState {
  guideline: GuidelineTable | null
  guidelineName: string
  data: DataRow[] | null
  dataColumns: string[]
  dataName: string
}

export type ProjectAction =
  | { type: 'loadGuideline'; table: GuidelineTable; name: string }
  | { type: 'setRow'; parameterId: string; index: number; patch: Partial<GuidelineRow> }
  | { type: 'addParameter'; row: GuidelineRow }
  | { type: 'removeParameter'; parameterId: string }
  | { type: 'removeRow'; parameterId: string; index: number }
  | { type: 'loadData'; rows: DataRow[]; columns: string[]; name: string }
  | { type: 'clearData' }
  | { type: 'clear' }

export const initialState: ProjectState = {
  guideline: null,
  guidelineName: '',
  data: null,
  dataColumns: [],
  dataName: '',
}

/** Copia superficial de la tabla (Map nuevo con arrays nuevos) para inmutabilidad. */
function cloneTable(t: GuidelineTable): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const [k, rows] of t) m.set(k, rows.map((r) => ({ ...r })))
  return m
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'loadGuideline':
      return { ...state, guideline: cloneTable(action.table), guidelineName: action.name }
    case 'setRow': {
      if (!state.guideline) return state
      const t = cloneTable(state.guideline)
      const rows = t.get(action.parameterId)
      if (rows && rows[action.index]) {
        rows[action.index] = { ...rows[action.index], ...action.patch }
      }
      return { ...state, guideline: t }
    }
    case 'addParameter': {
      const t = state.guideline ? cloneTable(state.guideline) : new Map()
      const arr = t.get(action.row.parameterId) ?? []
      arr.push({ ...action.row })
      t.set(action.row.parameterId, arr)
      return { ...state, guideline: t }
    }
    case 'removeParameter': {
      if (!state.guideline) return state
      const t = cloneTable(state.guideline)
      t.delete(action.parameterId)
      return { ...state, guideline: t }
    }
    case 'removeRow': {
      if (!state.guideline) return state
      const t = cloneTable(state.guideline)
      const rows = t.get(action.parameterId)
      if (rows) {
        rows.splice(action.index, 1)
        if (rows.length === 0) t.delete(action.parameterId)
        else t.set(action.parameterId, rows)
      }
      return { ...state, guideline: t }
    }
    case 'loadData':
      return { ...state, data: action.rows, dataColumns: action.columns, dataName: action.name }
    case 'clearData':
      return { ...state, data: null, dataColumns: [], dataName: '' }
    case 'clear':
      return initialState
    default:
      return state
  }
}
```

- [ ] **Step 4: Correr y verificar que TODA la suite del reducer pasa**

Run: `npm test -- src/state/projectReducer.test.ts`
Expected: PASS (las existentes + las 2 nuevas).

- [ ] **Step 5: Verificar compilación (los tipos nuevos no rompen el resto)**

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 6: Commit**

```bash
git add src/state/projectReducer.ts src/state/projectReducer.test.ts
git commit -m "feat(state): extender ProjectStore con el dataset (loadData/clearData)"
```

---

### Task 2: Carga de datos (`DataEntry`)

**Files:**
- Create: `src/ui/datos/DataEntry.tsx`
- Create: `src/ui/datos/DataEntry.css`
- Test: `src/ui/datos/DataEntry.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `parseDataCsv` de `../../io/parseData`; `workbookToCsv` de `../../io/readExcel`.
- Produces: `DataEntry` — botón que abre un selector de archivo (CSV/Excel), parsea a `DataRow[]` y despacha `loadData`; maneja errores con un mensaje `role="alert"`.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/datos/DataEntry.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { DataEntry } from './DataEntry'

function Probe() {
  const { state } = useProject()
  return <div data-testid="probe">{state.data ? `${state.dataName}:${state.data.length}` : 'sin-datos'}</div>
}

function setup() {
  render(
    <ProjectProvider>
      <DataEntry />
      <Probe />
    </ProjectProvider>,
  )
}

describe('DataEntry', () => {
  it('carga un CSV de datos y lo guarda en el estado', async () => {
    setup()
    const csv = 'Station,Date,DO\nS1,2020-01-01,7\nS1,2020-02-01,6\n'
    const file = new File([csv], 'datos.csv', { type: 'text/csv' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(screen.getByTestId('probe').textContent).toBe('datos.csv:2')
  })
  it('muestra un mensaje si el archivo no se puede leer', async () => {
    setup()
    const bad = new File([new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])], 'malo.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, bad)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/datos/DataEntry.test.tsx`
Expected: FAIL "Cannot find module './DataEntry'".

- [ ] **Step 3: Implementar `src/ui/datos/DataEntry.tsx`**

```tsx
import { useRef, useState } from 'react'
import { useProject } from '../../state/ProjectContext'
import { parseDataCsv } from '../../io/parseData'
import { workbookToCsv } from '../../io/readExcel'
import './DataEntry.css'

export function DataEntry() {
  const { dispatch } = useProject()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const isExcel = /\.xlsx?$/i.test(file.name)
      const csv = isExcel ? workbookToCsv(await file.arrayBuffer()) : await file.text()
      const { rows, columns } = parseDataCsv(csv)
      dispatch({ type: 'loadData', rows, columns, name: file.name })
      setError(null)
    } catch {
      setError('No se pudo leer el archivo. Verifica que sea un CSV o Excel (.xlsx) válido en formato ancho.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <section className="dentry">
      <h2>Sube tus datos de monitoreo</h2>
      <p className="dentry-help">
        Formato ancho: columnas <code>Station</code>, <code>Date</code> y una columna por parámetro.
        Acepta CSV o Excel (.xlsx). Los valores bajo el límite de detección pueden escribirse como <code>&lt;0.01</code>.
      </p>
      <button className="dbtn" onClick={() => fileRef.current?.click()}>Elegir archivo</button>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} aria-label="Subir archivo de datos" />
      {error && <p className="dentry-error" role="alert">{error}</p>}
    </section>
  )
}
```

- [ ] **Step 4: Crear `src/ui/datos/DataEntry.css`**

```css
.dentry h2 { font-size: 1.25rem; margin: 0 0 0.5rem; }
.dentry-help { color: var(--muted); max-width: 620px; line-height: 1.5; margin: 0 0 1rem; }
.dentry code { background: var(--card); border: 1px solid var(--line); border-radius: 4px; padding: 0.05rem 0.3rem; font-size: 0.85em; }
.dbtn {
  background: var(--accent); color: #fff; border: none; border-radius: 8px;
  padding: 0.5rem 0.9rem; cursor: pointer; font: inherit; font-weight: 600;
}
.dbtn:hover { filter: brightness(1.08); }
.dentry-error { color: #c0392b; margin-top: 0.75rem; font-size: 0.9rem; }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/datos/DataEntry.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/ui/datos/DataEntry.tsx src/ui/datos/DataEntry.css src/ui/datos/DataEntry.test.tsx
git commit -m "feat(ui): carga de datos de monitoreo (CSV/Excel) con manejo de error"
```

---

### Task 3: Vista previa de datos (`DataPreview`)

**Files:**
- Create: `src/ui/datos/DataPreview.tsx`
- Create: `src/ui/datos/DataPreview.css`
- Test: `src/ui/datos/DataPreview.test.tsx`

**Interfaces:**
- Consumes: `useProject`.
- Produces: `DataPreview` — tabla con `Station`, `Date` y las columnas de parámetros; muestra hasta 8 filas y, si hay más, un texto "… y N filas más".

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/datos/DataPreview.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { DataPreview } from './DataPreview'
import type { DataRow } from '../../engine/types'

function Seed({ rows }: { rows: DataRow[] }) {
  const { dispatch } = useProject()
  return <button onClick={() => dispatch({ type: 'loadData', rows, columns: ['DO'], name: 'd.csv' })}>seed</button>
}

async function setup(rows: DataRow[]) {
  render(
    <ProjectProvider>
      <Seed rows={rows} />
      <DataPreview />
    </ProjectProvider>,
  )
  await userEvent.click(screen.getByText('seed'))
}

describe('DataPreview', () => {
  it('muestra las columnas y las filas de datos', async () => {
    await setup([{ station: 'S1', date: new Date(2020, 0, 1), values: { DO: '7' } }])
    expect(screen.getByText('DO')).toBeInTheDocument()
    expect(screen.getByText('S1')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })
  it('indica cuántas filas adicionales hay más allá de 8', async () => {
    const many: DataRow[] = Array.from({ length: 10 }, (_, i) => ({ station: `S${i}`, date: null, values: { DO: String(i) } }))
    await setup(many)
    expect(screen.getByText(/2 filas más/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/datos/DataPreview.test.tsx`
Expected: FAIL "Cannot find module './DataPreview'".

- [ ] **Step 3: Implementar `src/ui/datos/DataPreview.tsx`**

```tsx
import { useProject } from '../../state/ProjectContext'
import './DataPreview.css'

const MAX_ROWS = 8

export function DataPreview() {
  const { state } = useProject()
  if (!state.data) return null
  const rows = state.data.slice(0, MAX_ROWS)
  const extra = state.data.length - rows.length

  return (
    <div className="dprev-wrap">
      <table className="dprev">
        <thead>
          <tr>
            <th>Station</th>
            <th>Date</th>
            {state.dataColumns.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.station}</td>
              <td>{r.date ? r.date.toLocaleDateString() : ''}</td>
              {state.dataColumns.map((c) => <td key={c}>{r.values[c] ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {extra > 0 && <p className="dprev-more">… y {extra} filas más.</p>}
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/datos/DataPreview.css`**

```css
.dprev-wrap { overflow-x: auto; margin-top: 1rem; }
.dprev { border-collapse: collapse; font-size: 0.88rem; white-space: nowrap; }
.dprev th { text-align: left; color: var(--muted); font-weight: 600; padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--line); }
.dprev td { padding: 0.3rem 0.6rem; border-bottom: 1px solid var(--line); }
.dprev-more { color: var(--muted); font-size: 0.85rem; margin-top: 0.5rem; }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/datos/DataPreview.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/ui/datos/DataPreview.tsx src/ui/datos/DataPreview.css src/ui/datos/DataPreview.test.tsx
git commit -m "feat(ui): vista previa de los datos cargados"
```

---

### Task 4: Panel de validación cruzada (`DataValidationPanel`)

**Files:**
- Create: `src/ui/datos/DataValidationPanel.tsx`
- Create: `src/ui/datos/DataValidationPanel.css`
- Test: `src/ui/datos/DataValidationPanel.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `validateData` de `../../validation/validateData`.
- Produces: `DataValidationPanel` — si no hay datos → null; si hay datos pero no hay guía → aviso "carga una guía primero"; si hay ambos → corre `validateData`, muestra el resumen de emparejamiento, los issues por severidad, y la compuerta "Listo para calcular" / "Corrige los errores".

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/datos/DataValidationPanel.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { DataValidationPanel } from './DataValidationPanel'
import type { GuidelineTable, DataRow } from '../../engine/types'

function Seed({ table, rows, columns }: { table?: GuidelineTable; rows: DataRow[]; columns: string[] }) {
  const { dispatch } = useProject()
  function go() {
    if (table) dispatch({ type: 'loadGuideline', table, name: 'g' })
    dispatch({ type: 'loadData', rows, columns, name: 'd.csv' })
  }
  return <button onClick={go}>seed</button>
}

async function setup(props: { table?: GuidelineTable; rows: DataRow[]; columns: string[] }) {
  render(
    <ProjectProvider>
      <Seed {...props} />
      <DataValidationPanel />
    </ProjectProvider>,
  )
  await userEvent.click(screen.getByText('seed'))
}

describe('DataValidationPanel', () => {
  it('pide cargar una guía si hay datos pero no guía', async () => {
    await setup({ rows: [{ station: 'S1', date: null, values: { DO: '7' } }], columns: ['DO'] })
    expect(screen.getByText(/carga una guía/i)).toBeInTheDocument()
  })
  it('muestra "listo para calcular" cuando no hay errores', async () => {
    const t: GuidelineTable = new Map([['DO', [{ parameterId: 'DO', ruleType: 'min', lowerLimit: 5, upperLimit: null, unit: 'mg/L' }]]])
    await setup({ table: t, rows: [{ station: 'S1', date: null, values: { DO: '7' } }], columns: ['DO'] })
    expect(screen.getByText(/listo para calcular/i)).toBeInTheDocument()
  })
  it('bloquea cuando una regla por dureza no tiene columna de dureza', async () => {
    const t: GuidelineTable = new Map([['CU', [{ parameterId: 'CU', ruleType: 'cuHardness', lowerLimit: null, upperLimit: null, unit: 'ug/L' }]]])
    await setup({ table: t, rows: [{ station: 'S1', date: null, values: { CU: '5' } }], columns: ['CU'] })
    expect(screen.getByText(/corrige los errores/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/datos/DataValidationPanel.test.tsx`
Expected: FAIL "Cannot find module './DataValidationPanel'".

- [ ] **Step 3: Implementar `src/ui/datos/DataValidationPanel.tsx`**

```tsx
import { useMemo } from 'react'
import { useProject } from '../../state/ProjectContext'
import { validateData } from '../../validation/validateData'
import './DataValidationPanel.css'

export function DataValidationPanel() {
  const { state } = useProject()
  const result = useMemo(() => {
    if (!state.data || !state.guideline) return null
    return validateData(state.data, state.dataColumns, state.guideline)
  }, [state.data, state.dataColumns, state.guideline])

  if (!state.data) return null
  if (!state.guideline) {
    return <p className="dvp-warn">🟡 Carga una guía en el paso ① antes de validar los datos.</p>
  }
  if (!result) return null

  const errors = result.issues.filter((i) => i.severity === 'error')
  const warns = result.issues.filter((i) => i.severity === 'warn')

  return (
    <div className="dvp">
      <div className="dvp-summary">
        <span>✅ {result.matched.length} emparejados</span>
        <span>◦ {result.dataWithoutGuideline.length} datos sin guía</span>
        <span>◦ {result.guidelineWithoutData.length} guías sin datos</span>
      </div>
      {errors.length > 0 && (
        <ul className="dvp-list dvp-errors">{errors.map((i, k) => <li key={`e${k}`}>🔴 {i.message}</li>)}</ul>
      )}
      {warns.length > 0 && (
        <ul className="dvp-list dvp-warns">{warns.map((i, k) => <li key={`w${k}`}>🟡 {i.message}</li>)}</ul>
      )}
      {errors.length === 0 ? (
        <p className="dvp-ready">✅ Listo para calcular el WQI.</p>
      ) : (
        <p className="dvp-blocked">Corrige los errores 🔴 antes de calcular.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/datos/DataValidationPanel.css`**

```css
.dvp { margin: 1rem 0; }
.dvp-warn { color: var(--muted); }
.dvp-summary { display: flex; gap: 1rem; flex-wrap: wrap; color: var(--muted); font-size: 0.9rem; margin-bottom: 0.75rem; }
.dvp-list { list-style: none; padding: 0.75rem 1rem; margin: 0 0 0.5rem; border-radius: 10px; border: 1px solid var(--line); }
.dvp-list li { padding: 0.2rem 0; line-height: 1.4; font-size: 0.92rem; }
.dvp-errors { background: rgba(192, 57, 43, 0.08); }
.dvp-warns { background: rgba(241, 196, 15, 0.1); }
.dvp-ready { color: var(--accent2); font-weight: 600; }
.dvp-blocked { color: #c0392b; font-weight: 600; }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/datos/DataValidationPanel.test.tsx`
Expected: PASS (3 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/ui/datos/DataValidationPanel.tsx src/ui/datos/DataValidationPanel.css src/ui/datos/DataValidationPanel.test.tsx
git commit -m "feat(ui): panel de validacion cruzada de datos con compuerta de calculo"
```

---

### Task 5: Ensamblar el Módulo Datos + montar en el shell

**Files:**
- Create: `src/ui/datos/DatosModule.tsx`
- Create: `src/ui/datos/DatosModule.css`
- Modify: `src/App.tsx`
- Test: `src/ui/datos/DatosModule.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `DataEntry`, `DataPreview`, `DataValidationPanel`.
- Produces: `DatosModule` — si no hay datos muestra `DataEntry`; si hay datos muestra una barra (nombre + nº de filas + botón "Cambiar datos" que despacha `clearData`), el panel de validación y la vista previa. Se monta en el paso `datos` del `AppShell`.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/datos/DatosModule.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider } from '../../state/ProjectContext'
import { DatosModule } from './DatosModule'

function setup() {
  render(
    <ProjectProvider>
      <DatosModule />
    </ProjectProvider>,
  )
}

describe('DatosModule', () => {
  it('muestra la entrada cuando no hay datos', () => {
    setup()
    expect(screen.getByText(/sube tus datos/i)).toBeInTheDocument()
  })
  it('tras cargar un CSV muestra la barra con el número de filas y el botón cambiar', async () => {
    setup()
    const csv = 'Station,Date,DO\nS1,2020-01-01,7\n'
    const file = new File([csv], 'd.csv', { type: 'text/csv' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(screen.getByRole('button', { name: /cambiar datos/i })).toBeInTheDocument()
    expect(screen.getByText(/1 filas/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/datos/DatosModule.test.tsx`
Expected: FAIL "Cannot find module './DatosModule'".

- [ ] **Step 3: Implementar `src/ui/datos/DatosModule.tsx`**

```tsx
import { useProject } from '../../state/ProjectContext'
import { DataEntry } from './DataEntry'
import { DataPreview } from './DataPreview'
import { DataValidationPanel } from './DataValidationPanel'
import './DatosModule.css'

export function DatosModule() {
  const { state, dispatch } = useProject()

  if (!state.data) return <DataEntry />

  return (
    <section className="datos">
      <div className="datos-bar">
        <h2>{state.dataName || 'Datos'} · {state.data.length} filas</h2>
        <button className="dbtn-ghost" onClick={() => dispatch({ type: 'clearData' })}>Cambiar datos</button>
      </div>
      <DataValidationPanel />
      <DataPreview />
    </section>
  )
}
```

- [ ] **Step 4: Crear `src/ui/datos/DatosModule.css`**

```css
.datos-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.datos-bar h2 { font-size: 1.2rem; margin: 0; }
.dbtn-ghost {
  background: none; color: var(--muted); border: 1px solid var(--line);
  border-radius: 8px; padding: 0.5rem 0.9rem; cursor: pointer; font: inherit; font-weight: 600;
}
.dbtn-ghost:hover { color: var(--text); }
```

- [ ] **Step 5: Montar el módulo en el shell (`src/App.tsx`)**

Reemplaza el contenido por:

```tsx
import { AppShell } from './ui/AppShell'
import { GuiasModule } from './ui/guias/GuiasModule'
import { DatosModule } from './ui/datos/DatosModule'
import './App.css'

function App() {
  return <AppShell steps={{ guias: <GuiasModule />, datos: <DatosModule /> }} />
}

export default App
```

- [ ] **Step 6: Correr la prueba, TODA la suite y el build**

Run: `npm test -- src/ui/datos/DatosModule.test.tsx`
Expected: PASS (2 pruebas).

Run: `npm test`
Expected: PASS en todos los archivos (motor + io + presets + validación + ui).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 7: Commit**

```bash
git add src/ui/datos/DatosModule.tsx src/ui/datos/DatosModule.css src/App.tsx src/ui/datos/DatosModule.test.tsx
git commit -m "feat(ui): ensamblar Modulo Datos y montarlo en el shell"
```

---

## Self-Review

**1. Cobertura del spec (§7 Módulo Datos):**
- Carga CSV/Excel formato ancho, no-detectados crudos → Task 2 (reutiliza `parseDataCsv`). ✅
- Vista previa de primeras filas → Task 3. ✅
- Validación cruzada: emparejamiento (matched / datos sin guía / guías sin datos), dependencias dureza/pH/temp, tipos, rangos, requisito de parámetros → Task 4 (reutiliza `validateData`). ✅
- Compuerta "listo para calcular" (sólo sin errores 🔴) → Task 4. ✅
- Estado del dataset en el store → Task 1. ✅
- Montado en el paso Datos del shell → Task 5. ✅

**2. Placeholders:** ninguno; todo el código (TSX/CSS) está completo.

**3. Consistencia de tipos:** `ProjectState`/`ProjectAction` (ampliados en Task 1) se usan en Tasks 2–5 (`loadData`/`clearData`, `state.data`, `state.dataColumns`, `state.dataName`); `parseDataCsv` devuelve `{rows, columns, issues}` y `validateData(rows, columns, table)` devuelve `{matched, dataWithoutGuideline, guidelineWithoutData, issues}`, consumidos con esas firmas.

**Nota de estilo:** los botones del Módulo Datos usan clases propias (`.dbtn`, `.dbtn-ghost`) para no depender del CSS del Módulo Guías; comparten los mismos tokens visuales. Un stylesheet compartido de botones puede unificarse en una fase de pulido.

**Fuera de alcance (fases siguientes):** mapeo manual de columnas que no empatan (renombrar/asociar una columna de datos a un parámetro de la guía); Módulo Resultados (Fase 5) con el cálculo y las gráficas; Ayuda (Fase 6); autoguardado/proyecto `.ica.json` (Fase 7); asistente de alta de parámetros en Guías (Fase 3B).
