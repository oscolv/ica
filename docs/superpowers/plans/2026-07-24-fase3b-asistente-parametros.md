# Fase 3B — Asistente de alta de parámetros · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir agregar parámetros a una guía desde la UI: un catálogo de parámetros comunes (DBO, DQO, fluoruro, E. coli…) y un formulario que valida y despacha, integrado en el Módulo Guías (hace útil "empezar de cero").

**Architecture:** Un catálogo de parámetros como datos puros en `src/ui/guias/paramCatalog.ts` (con un conversor a `GuidelineRow`), un componente `AddParameterForm` que arma un parámetro y lo despacha al store con validación anti-duplicados, y su integración en `GuiasModule`. Reutiliza `RULE_LABELS` (Fase 3A) y la acción `addParameter` (ya existente en el reducer). Sin dependencias nuevas.

**Tech Stack:** React, Vite, TypeScript, Vitest, @testing-library/react.

## Global Constraints

- El motor `src/engine/` y las capas `src/io`, `src/presets`, `src/validation`, `src/state`, `src/results` NO se modifican; se consumen vía sus módulos. `src/ui/guias/GuiasModule.tsx` sí se modifica para integrar el formulario.
- Idioma español; todo en el navegador; tokens CSS de `src/App.css`; sin dependencias nuevas.
- La acción `addParameter` ya existe en el reducer (Fase 3A); no se toca el estado.
- Las pruebas verifican comportamiento observable.

---

### Task 1: Catálogo de parámetros comunes (`paramCatalog`)

**Files:**
- Create: `src/ui/guias/paramCatalog.ts`
- Test: `src/ui/guias/paramCatalog.test.ts`

**Interfaces:**
- Consumes: `RuleType`, `GuidelineRow` de `../../engine/types`.
- Produces:
  - `interface CatalogEntry { id: string; label: string; parameterId: string; ruleType: RuleType; lowerLimit: number | null; upperLimit: number | null; unit: string; source: string }`
  - `PARAM_CATALOG: CatalogEntry[]`
  - `catalogToRow(e: CatalogEntry): GuidelineRow`

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/guias/paramCatalog.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { PARAM_CATALOG, catalogToRow } from './paramCatalog'

describe('paramCatalog', () => {
  it('incluye parámetros mexicanos típicos', () => {
    const ids = PARAM_CATALOG.map((e) => e.parameterId)
    expect(ids).toContain('BOD5_mgL')
    expect(ids).toContain('FLUORIDE_mgL')
    expect(ids).toContain('E_COLI_NMP100mL')
  })
  it('convierte una entrada del catálogo en una fila de guía', () => {
    const e = PARAM_CATALOG.find((x) => x.parameterId === 'FLUORIDE_mgL')!
    const row = catalogToRow(e)
    expect(row.parameterId).toBe('FLUORIDE_mgL')
    expect(row.ruleType).toBe('max')
    expect(row.upperLimit).toBe(1.5)
    expect(row.unit).toBe('mg/L')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/guias/paramCatalog.test.ts`
Expected: FAIL "Cannot find module './paramCatalog'".

- [ ] **Step 3: Implementar `src/ui/guias/paramCatalog.ts`**

```ts
import type { RuleType, GuidelineRow } from '../../engine/types'

export interface CatalogEntry {
  id: string
  label: string
  parameterId: string
  ruleType: RuleType
  lowerLimit: number | null
  upperLimit: number | null
  unit: string
  source: string
}

// Valores de referencia PROVISIONALES (verificar contra NOM-127 / CE-CCA / OMS).
export const PARAM_CATALOG: CatalogEntry[] = [
  { id: 'bod5', label: 'DBO₅ (demanda bioquímica de oxígeno)', parameterId: 'BOD5_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 30, unit: 'mg/L', source: 'NOM-001-SEMARNAT-2021 (provisional)' },
  { id: 'cod', label: 'DQO (demanda química de oxígeno)', parameterId: 'COD_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 40, unit: 'mg/L', source: 'Referencia general (provisional)' },
  { id: 'fluoride', label: 'Fluoruro', parameterId: 'FLUORIDE_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 1.5, unit: 'mg/L', source: 'NOM-127-SSA1-2021 / OMS (provisional)' },
  { id: 'ecoli', label: 'E. coli', parameterId: 'E_COLI_NMP100mL', ruleType: 'max', lowerLimit: null, upperLimit: 0, unit: 'NMP/100mL', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'fcoli', label: 'Coliformes fecales', parameterId: 'FECAL_COLIFORM_NMP100mL', ruleType: 'max', lowerLimit: null, upperLimit: 1000, unit: 'NMP/100mL', source: 'CE-CCA-001/89 (provisional)' },
  { id: 'do', label: 'Oxígeno disuelto', parameterId: 'DISSOLVED_OXYGEN_mgL', ruleType: 'min', lowerLimit: 5, upperLimit: null, unit: 'mg/L', source: 'CE-CCA-001/89 (provisional)' },
  { id: 'ph', label: 'pH', parameterId: 'PH', ruleType: 'range', lowerLimit: 6.5, upperLimit: 8.5, unit: '', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'nitrate', label: 'Nitrato (como N)', parameterId: 'NITRATE_mgLasN', ruleType: 'max', lowerLimit: null, upperLimit: 11, unit: 'mg/L', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'tp', label: 'Fósforo total', parameterId: 'TOTAL_PHOSPHORUS_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L', source: 'Referencia general (provisional)' },
  { id: 'turbidity', label: 'Turbidez', parameterId: 'TURBIDITY_NTU', ruleType: 'max', lowerLimit: null, upperLimit: 5, unit: 'NTU', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'tds', label: 'Sólidos disueltos totales', parameterId: 'TOTAL_DISSOLVED_SOLIDS_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 1000, unit: 'mg/L', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'arsenic', label: 'Arsénico', parameterId: 'ARSENIC_TOTAL_ugL', ruleType: 'max', lowerLimit: null, upperLimit: 10, unit: 'ug/L', source: 'NOM-127-SSA1-2021 / OMS (provisional)' },
]

export function catalogToRow(e: CatalogEntry): GuidelineRow {
  return {
    parameterId: e.parameterId,
    ruleType: e.ruleType,
    lowerLimit: e.lowerLimit,
    upperLimit: e.upperLimit,
    unit: e.unit || undefined,
    source: e.source || undefined,
  }
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/ui/guias/paramCatalog.test.ts`
Expected: PASS (2 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/ui/guias/paramCatalog.ts src/ui/guias/paramCatalog.test.ts
git commit -m "feat(ui): catalogo de parametros comunes para el asistente de guias"
```

---

### Task 2: Formulario de alta (`AddParameterForm`)

**Files:**
- Create: `src/ui/guias/AddParameterForm.tsx`
- Create: `src/ui/guias/AddParameterForm.css`
- Test: `src/ui/guias/AddParameterForm.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `PARAM_CATALOG`, `catalogToRow` de `./paramCatalog`; `RULE_LABELS` de `./ruleLabels`; `RuleType`, `GuidelineRow` de `../../engine/types`.
- Produces: `AddParameterForm({ onDone }: { onDone: () => void })` — un `<select>` de catálogo (o "Personalizado") que rellena los campos, campos editables (parámetro, tipo de regla, límites inf/sup, unidad, fuente), validación (nombre requerido y no duplicado; límite según regla) con mensaje `role="alert"`, y botones "Agregar" (despacha `addParameter` y llama `onDone`) y "Cancelar" (`onDone`).

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/guias/AddParameterForm.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { AddParameterForm } from './AddParameterForm'

function Seed() {
  const { dispatch } = useProject()
  return <button onClick={() => dispatch({ type: 'loadGuideline', table: new Map(), name: 'x' })}>seed</button>
}
function Probe() {
  const { state } = useProject()
  return <div data-testid="probe">{state.guideline ? [...state.guideline.keys()].join(',') : ''}</div>
}

function setup() {
  render(
    <ProjectProvider>
      <Seed />
      <AddParameterForm onDone={() => {}} />
      <Probe />
    </ProjectProvider>,
  )
}

describe('AddParameterForm', () => {
  it('elige del catálogo y agrega el parámetro a la guía', async () => {
    setup()
    await userEvent.click(screen.getByText('seed'))
    await userEvent.selectOptions(screen.getByLabelText(/catálogo/i), 'fluoride')
    await userEvent.click(screen.getByRole('button', { name: /agregar/i }))
    expect(screen.getByTestId('probe').textContent).toContain('FLUORIDE_mgL')
  })
  it('rechaza un parámetro duplicado', async () => {
    setup()
    await userEvent.click(screen.getByText('seed'))
    // agrega fluoruro una vez
    await userEvent.selectOptions(screen.getByLabelText(/catálogo/i), 'fluoride')
    await userEvent.click(screen.getByRole('button', { name: /agregar/i }))
    // intenta de nuevo
    await userEvent.selectOptions(screen.getByLabelText(/catálogo/i), 'fluoride')
    await userEvent.click(screen.getByRole('button', { name: /agregar/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
  it('exige nombre de parámetro', async () => {
    setup()
    await userEvent.click(screen.getByText('seed'))
    await userEvent.click(screen.getByRole('button', { name: /agregar/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/guias/AddParameterForm.test.tsx`
Expected: FAIL "Cannot find module './AddParameterForm'".

- [ ] **Step 3: Implementar `src/ui/guias/AddParameterForm.tsx`**

```tsx
import { useState } from 'react'
import { useProject } from '../../state/ProjectContext'
import { PARAM_CATALOG, catalogToRow } from './paramCatalog'
import { RULE_LABELS } from './ruleLabels'
import type { RuleType, GuidelineRow } from '../../engine/types'
import './AddParameterForm.css'

const RULE_TYPES = Object.keys(RULE_LABELS) as RuleType[]

function numOrNull(v: string): number | null {
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function AddParameterForm({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useProject()
  const [parameterId, setParameterId] = useState('')
  const [ruleType, setRuleType] = useState<RuleType>('max')
  const [lower, setLower] = useState('')
  const [upper, setUpper] = useState('')
  const [unit, setUnit] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState<string | null>(null)

  function pickCatalog(id: string) {
    const e = PARAM_CATALOG.find((c) => c.id === id)
    if (!e) return
    setParameterId(e.parameterId)
    setRuleType(e.ruleType)
    setLower(e.lowerLimit == null ? '' : String(e.lowerLimit))
    setUpper(e.upperLimit == null ? '' : String(e.upperLimit))
    setUnit(e.unit)
    setSource(e.source)
    setError(null)
  }

  function submit() {
    const id = parameterId.trim()
    if (id === '') { setError('Escribe el nombre del parámetro.'); return }
    if (state.guideline?.has(id)) { setError(`El parámetro "${id}" ya existe en la guía.`); return }
    const lo = numOrNull(lower), up = numOrNull(upper)
    if (ruleType === 'max' && up == null) { setError('La regla de máximo requiere un límite superior.'); return }
    if (ruleType === 'min' && lo == null) { setError('La regla de mínimo requiere un límite inferior.'); return }
    if (ruleType === 'range' && lo == null && up == null) { setError('El rango requiere al menos un límite.'); return }

    const row: GuidelineRow = { parameterId: id, ruleType, lowerLimit: lo, upperLimit: up, unit: unit.trim() || undefined, source: source.trim() || undefined }
    dispatch({ type: 'addParameter', row })
    onDone()
  }

  return (
    <div className="apf">
      <div className="apf-row">
        <label>Del catálogo
          <select aria-label="Catálogo de parámetros" defaultValue="" onChange={(e) => pickCatalog(e.target.value)}>
            <option value="">— Personalizado —</option>
            {PARAM_CATALOG.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
      </div>
      <div className="apf-grid">
        <label>Parámetro
          <input value={parameterId} onChange={(e) => setParameterId(e.target.value)} placeholder="p. ej. BOD5_mgL" />
        </label>
        <label>Tipo de regla
          <select value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)}>
            {RULE_TYPES.map((rt) => <option key={rt} value={rt}>{RULE_LABELS[rt]}</option>)}
          </select>
        </label>
        <label>Límite inferior
          <input value={lower} inputMode="decimal" onChange={(e) => setLower(e.target.value)} />
        </label>
        <label>Límite superior
          <input value={upper} inputMode="decimal" onChange={(e) => setUpper(e.target.value)} />
        </label>
        <label>Unidad
          <input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </label>
        <label>Fuente
          <input value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
      </div>
      {error && <p className="apf-error" role="alert">{error}</p>}
      <div className="apf-actions">
        <button className="apf-btn" onClick={submit}>Agregar</button>
        <button className="apf-btn apf-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/guias/AddParameterForm.css`**

```css
.apf { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
.apf-row { margin-bottom: 0.75rem; }
.apf-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.6rem; }
.apf label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: var(--muted); }
.apf input, .apf select { background: var(--bg); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 0.4rem 0.5rem; font: inherit; }
.apf-error { color: #c0392b; font-size: 0.9rem; margin: 0.75rem 0 0; }
.apf-actions { display: flex; gap: 0.5rem; margin-top: 0.9rem; }
.apf-btn { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.9rem; cursor: pointer; font: inherit; font-weight: 600; }
.apf-ghost { background: none; color: var(--muted); border: 1px solid var(--line); }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/guias/AddParameterForm.test.tsx`
Expected: PASS (3 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/ui/guias/AddParameterForm.tsx src/ui/guias/AddParameterForm.css src/ui/guias/AddParameterForm.test.tsx
git commit -m "feat(ui): formulario de alta de parametros con catalogo y validacion"
```

---

### Task 3: Integrar el asistente en el Módulo Guías

**Files:**
- Modify: `src/ui/guias/GuiasModule.tsx`
- Test: `src/ui/guias/GuiasModule.test.tsx` (agregar prueba; no quitar las existentes)

**Interfaces:**
- Consumes: además de lo actual, `AddParameterForm` de `./AddParameterForm`.
- Produces: el `GuiasModule` muestra un botón "Agregar parámetro" que alterna la visibilidad de `<AddParameterForm>` (encima del editor); al terminar (`onDone`), se oculta.

- [ ] **Step 1: Leer el archivo actual y agregar la prueba que falla**

Lee `src/ui/guias/GuiasModule.test.tsx`. Agrega, dentro del `describe` existente, esta prueba:

```tsx
  it('abre el formulario de agregar parámetro', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /CCME/i }))
    await userEvent.click(screen.getByRole('button', { name: /agregar parámetro/i }))
    expect(screen.getByLabelText(/catálogo/i)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Correr y verificar que la nueva falla**

Run: `npm test -- src/ui/guias/GuiasModule.test.tsx`
Expected: FAIL en la prueba nueva (no existe el botón "Agregar parámetro").

- [ ] **Step 3: Modificar `src/ui/guias/GuiasModule.tsx`**

Agrega el import y un estado local, y renderiza el botón + el formulario condicional. Concretamente:

1. Agrega a los imports:
```tsx
import { useState } from 'react'
import { AddParameterForm } from './AddParameterForm'
```

2. Dentro del componente `GuiasModule`, tras obtener `{ state, dispatch }` de `useProject()`, agrega:
```tsx
  const [showAdd, setShowAdd] = useState(false)
```

3. En la barra de acciones `guias-actions` (donde están "Descargar CSV" y "Cambiar guía"), agrega como primer botón:
```tsx
          <button className="btn" onClick={() => setShowAdd((v) => !v)}>Agregar parámetro</button>
```

4. Justo antes de `<ValidationPanel />`, agrega el formulario condicional:
```tsx
      {showAdd && <AddParameterForm onDone={() => setShowAdd(false)} />}
```

- [ ] **Step 4: Correr la prueba, TODA la suite y el build**

Run: `npm test -- src/ui/guias/GuiasModule.test.tsx`
Expected: PASS (las existentes + la nueva).

Run: `npm test`
Expected: PASS en todos los archivos.

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 5: Commit**

```bash
git add src/ui/guias/GuiasModule.tsx src/ui/guias/GuiasModule.test.tsx
git commit -m "feat(ui): integrar el asistente de alta de parametros en el Modulo Guias"
```

---

## Self-Review

**1. Cobertura del spec (§6 asistente "Agregar parámetro"):**
- Catálogo de parámetros comunes con valores sugeridos citados → Task 1. ✅
- Formulario paso a paso (nombre → unidad → tipo de regla → límites → fuente) con validación (nombre requerido/no duplicado, límite según regla) → Task 2. ✅
- Integración en el Módulo Guías (hace útil "empezar de cero") → Task 3. ✅
- Reutiliza `addParameter` (reducer) y `RULE_LABELS` sin modificarlos. ✅

**2. Placeholders:** ninguno; todo el código está completo.

**3. Consistencia de tipos:** `CatalogEntry`/`catalogToRow` (Task 1) usados por `AddParameterForm` (Task 2); el formulario despacha `addParameter` con un `GuidelineRow` válido; `GuiasModule` (Task 3) alterna el formulario. Los valores del catálogo son PROVISIONALES (a verificar contra la norma mexicana, como la plantilla México).

**Fuera de alcance (fases siguientes):** autoguardado/proyecto `.ica.json` (Fase 7); selección de periodo; exportación PDF/PNG; los pulidos diferidos (a11y, contraste).
