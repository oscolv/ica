# Fase 3A — App shell, estado y Módulo Guías · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el armazón de la app (encabezado + navegación de 4 pasos), el estado global (`ProjectStore`) y un Módulo ① Guías usable: cargar desde preset o archivo, editar en una tabla, ver validación en vivo y exportar el CSV.

**Architecture:** React + Vite + TS. Un `ProjectStore` (Context + `useReducer`, reducer puro y testeable) guarda la guía activa. El shell renderiza pestañas de pasos; sólo "Guías" está implementado (los demás muestran un marcador). El Módulo Guías reutiliza `src/io` (parseo/serialización), `src/presets` y `src/validation` de la Fase 2. Pruebas de componentes con Vitest + Testing Library (jsdom).

**Tech Stack:** React 19, Vite, TypeScript, Vitest, @testing-library/react, @testing-library/user-event, jsdom.

## Global Constraints

- El motor `src/engine/` y las capas `src/io`, `src/presets`, `src/validation` NO se modifican; se consumen vía sus módulos.
- Idioma del producto: español. Los `RuleType` se muestran con etiquetas en español; internamente siguen siendo los del motor.
- Todo en el navegador; sin llamadas de red. Diseño responsivo y compatible con tema claro/oscuro, reutilizando los tokens CSS de `src/App.css` (variables `--bg`, `--card`, `--line`, `--text`, `--muted`, `--accent`, `--accent2`).
- Componentes enfocados y de una sola responsabilidad; estado global sólo en `ProjectStore`.
- Las pruebas de componentes verifican comportamiento observable (texto en pantalla, cambios tras interacción), no detalles internos.

---

### Task 1: Configurar pruebas de componentes (Testing Library + jsdom)

**Files:**
- Modify: `package.json` (dev deps)
- Modify: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: entorno de pruebas de componentes (jsdom + matchers de jest-dom). El `smoke.test.tsx` se elimina en el commit de esta tarea (sólo valida el setup) — mantenerlo es aceptable pero se marca como temporal.

- [ ] **Step 1: Instalar dependencias de prueba de UI**

Run: `npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
Expected: se agregan a `devDependencies`.

- [ ] **Step 2: Crear `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Actualizar `vitest.config.ts`**

Reemplaza el contenido por:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 4: Escribir una prueba de humo (`src/test/smoke.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Hola() {
  return <p>hola ICA</p>
}

describe('setup de componentes', () => {
  it('renderiza un componente en jsdom', () => {
    render(<Hola />)
    expect(screen.getByText('hola ICA')).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Correr la prueba de humo y verificar que pasa**

Run: `npm test -- src/test/smoke.test.tsx`
Expected: PASS.

- [ ] **Step 6: Correr TODA la suite (regresión: el cambio de entorno no rompe motor/io/validación)**

Run: `npm test`
Expected: PASS en todos los archivos (los ~80 existentes + la prueba de humo).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/test/smoke.test.tsx
git commit -m "test(ui): setup de pruebas de componentes (testing-library + jsdom)"
```

---

### Task 2: Estado global (`ProjectStore`)

**Files:**
- Create: `src/state/projectReducer.ts`
- Create: `src/state/ProjectContext.tsx`
- Test: `src/state/projectReducer.test.ts`

**Interfaces:**
- Consumes: `GuidelineTable`, `GuidelineRow` de `../engine/types`.
- Produces:
  - `interface ProjectState { guideline: GuidelineTable | null; guidelineName: string }`
  - `type ProjectAction` (ver código).
  - `initialState: ProjectState`
  - `projectReducer(state, action): ProjectState`
  - `ProjectProvider` (componente) y `useProject(): { state: ProjectState; dispatch: React.Dispatch<ProjectAction> }`.

- [ ] **Step 1: Escribir la prueba que falla (`src/state/projectReducer.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { projectReducer, initialState } from './projectReducer'
import type { GuidelineTable, GuidelineRow } from '../engine/types'

function table(rows: GuidelineRow[]): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const r of rows) {
    const a = m.get(r.parameterId) ?? []
    a.push(r); m.set(r.parameterId, a)
  }
  return m
}
const row = (o: Partial<GuidelineRow>): GuidelineRow => ({
  parameterId: 'X', ruleType: 'max', lowerLimit: null, upperLimit: null, ...o,
})

describe('projectReducer', () => {
  it('loadGuideline reemplaza la guía y el nombre', () => {
    const t = table([row({ parameterId: 'AS', upperLimit: 5 })])
    const s = projectReducer(initialState, { type: 'loadGuideline', table: t, name: 'CCME' })
    expect(s.guidelineName).toBe('CCME')
    expect(s.guideline!.get('AS')![0].upperLimit).toBe(5)
  })
  it('setRow modifica una fila puntual sin mutar el estado previo', () => {
    const t = table([row({ parameterId: 'AS', upperLimit: 5 })])
    const s1 = projectReducer(initialState, { type: 'loadGuideline', table: t, name: 'x' })
    const s2 = projectReducer(s1, { type: 'setRow', parameterId: 'AS', index: 0, patch: { upperLimit: 10 } })
    expect(s2.guideline!.get('AS')![0].upperLimit).toBe(10)
    expect(s1.guideline!.get('AS')![0].upperLimit).toBe(5) // inmutable
  })
  it('addParameter agrega una fila nueva', () => {
    const s1 = projectReducer(initialState, { type: 'loadGuideline', table: table([]), name: 'x' })
    const s2 = projectReducer(s1, { type: 'addParameter', row: row({ parameterId: 'TP', ruleType: 'max', upperLimit: 0.05 }) })
    expect(s2.guideline!.get('TP')![0].upperLimit).toBe(0.05)
  })
  it('removeParameter elimina el parámetro', () => {
    const t = table([row({ parameterId: 'AS', upperLimit: 5 })])
    const s1 = projectReducer(initialState, { type: 'loadGuideline', table: t, name: 'x' })
    const s2 = projectReducer(s1, { type: 'removeParameter', parameterId: 'AS' })
    expect(s2.guideline!.has('AS')).toBe(false)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/state/projectReducer.test.ts`
Expected: FAIL "Cannot find module './projectReducer'".

- [ ] **Step 3: Implementar `src/state/projectReducer.ts`**

```ts
import type { GuidelineTable, GuidelineRow } from '../engine/types'

export interface ProjectState {
  guideline: GuidelineTable | null
  guidelineName: string
}

export type ProjectAction =
  | { type: 'loadGuideline'; table: GuidelineTable; name: string }
  | { type: 'setRow'; parameterId: string; index: number; patch: Partial<GuidelineRow> }
  | { type: 'addParameter'; row: GuidelineRow }
  | { type: 'removeParameter'; parameterId: string }
  | { type: 'clear' }

export const initialState: ProjectState = { guideline: null, guidelineName: '' }

/** Copia superficial de la tabla (Map nuevo con arrays nuevos) para inmutabilidad. */
function cloneTable(t: GuidelineTable): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const [k, rows] of t) m.set(k, rows.map((r) => ({ ...r })))
  return m
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'loadGuideline':
      return { guideline: cloneTable(action.table), guidelineName: action.name }
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
    case 'clear':
      return initialState
    default:
      return state
  }
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/state/projectReducer.test.ts`
Expected: PASS (4 pruebas).

- [ ] **Step 5: Implementar `src/state/ProjectContext.tsx`**

```tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { projectReducer, initialState, type ProjectState, type ProjectAction } from './projectReducer'

interface ProjectContextValue {
  state: ProjectState
  dispatch: React.Dispatch<ProjectAction>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState)
  return <ProjectContext.Provider value={{ state, dispatch }}>{children}</ProjectContext.Provider>
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject debe usarse dentro de <ProjectProvider>')
  return ctx
}
```

- [ ] **Step 6: Verificar compilación**

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 7: Commit**

```bash
git add src/state/
git commit -m "feat(state): ProjectStore (reducer puro inmutable + contexto React)"
```

---

### Task 3: App shell (encabezado + navegación de pasos)

**Files:**
- Create: `src/ui/AppShell.tsx`
- Create: `src/ui/AppShell.css`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Test: `src/ui/AppShell.test.tsx`

**Interfaces:**
- Consumes: `ProjectProvider` de `../state/ProjectContext`.
- Produces: `AppShell` con estado local de "paso activo" (`'guias' | 'datos' | 'resultados' | 'ayuda'`) y una prop `renderStep(step)` para inyectar el contenido de cada paso. Para esta tarea, los pasos muestran marcadores salvo que se pasen hijos.
  - `interface AppShellProps { steps?: Partial<Record<StepId, ReactNode>> }`
  - `type StepId = 'guias' | 'datos' | 'resultados' | 'ayuda'`

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/AppShell.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('muestra el paso Guías por defecto y permite cambiar de pestaña', async () => {
    render(
      <AppShell steps={{ guias: <p>contenido guias</p>, datos: <p>contenido datos</p> }} />,
    )
    expect(screen.getByText('contenido guias')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /datos/i }))
    expect(screen.getByText('contenido datos')).toBeInTheDocument()
  })
  it('muestra marcador "próximamente" para pasos sin contenido', () => {
    render(<AppShell />)
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/AppShell.test.tsx`
Expected: FAIL "Cannot find module './AppShell'".

- [ ] **Step 3: Implementar `src/ui/AppShell.tsx`**

```tsx
import { useState, type ReactNode } from 'react'
import './AppShell.css'

export type StepId = 'guias' | 'datos' | 'resultados' | 'ayuda'

const STEPS: { id: StepId; n: string; label: string }[] = [
  { id: 'guias', n: '①', label: 'Guías' },
  { id: 'datos', n: '②', label: 'Datos' },
  { id: 'resultados', n: '③', label: 'Resultados' },
  { id: 'ayuda', n: 'ⓘ', label: 'Ayuda' },
]

export interface AppShellProps {
  steps?: Partial<Record<StepId, ReactNode>>
}

export function AppShell({ steps = {} }: AppShellProps) {
  const [active, setActive] = useState<StepId>('guias')
  const content = steps[active]

  return (
    <div className="shell">
      <header className="shell-header">
        <span className="shell-brand">ICA</span>
        <span className="shell-title">Índice de Calidad del Agua</span>
      </header>
      <nav className="shell-nav" role="tablist" aria-label="Pasos">
        {STEPS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={active === s.id}
            className={`shell-tab${active === s.id ? ' is-active' : ''}`}
            onClick={() => setActive(s.id)}
          >
            <span className="shell-tab-n">{s.n}</span> {s.label}
          </button>
        ))}
      </nav>
      <main className="shell-main" role="tabpanel">
        {content ?? <p className="shell-placeholder">Este paso estará disponible próximamente.</p>}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/AppShell.css`**

```css
.shell { max-width: 1100px; margin: 0 auto; padding: 1rem 1.25rem 3rem; }
.shell-header { display: flex; align-items: center; gap: 0.7rem; padding: 0.75rem 0; }
.shell-brand {
  font-weight: 800; letter-spacing: 0.12em; color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.85rem;
}
.shell-title { color: var(--muted); font-weight: 600; }
.shell-nav {
  display: flex; gap: 0.25rem; flex-wrap: wrap;
  border-bottom: 1px solid var(--line); margin-bottom: 1.25rem;
}
.shell-tab {
  background: none; border: none; color: var(--muted);
  padding: 0.6rem 0.9rem; cursor: pointer; font-size: 0.95rem;
  border-bottom: 2px solid transparent; border-radius: 6px 6px 0 0;
}
.shell-tab:hover { color: var(--text); background: var(--card); }
.shell-tab.is-active { color: var(--text); border-bottom-color: var(--accent); font-weight: 600; }
.shell-tab-n { color: var(--accent2); }
.shell-placeholder { color: var(--muted); padding: 2rem 0; text-align: center; }
```

- [ ] **Step 5: Reemplazar `src/App.tsx`**

```tsx
import { AppShell } from './ui/AppShell'
import './App.css'

function App() {
  return <AppShell />
}

export default App
```

- [ ] **Step 6: Envolver la app con el proveedor de estado en `src/main.tsx`**

Reemplaza el contenido por:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProjectProvider } from './state/ProjectContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </StrictMode>,
)
```

- [ ] **Step 7: Correr la prueba y el build**

Run: `npm test -- src/ui/AppShell.test.tsx`
Expected: PASS (2 pruebas).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 8: Commit**

```bash
git add src/ui/AppShell.tsx src/ui/AppShell.css src/App.tsx src/main.tsx src/ui/AppShell.test.tsx
git commit -m "feat(ui): app shell con navegacion de 4 pasos y proveedor de estado"
```

---

### Task 4: Módulo Guías — carga (preset / archivo / vacío)

**Files:**
- Create: `src/ui/guias/GuidelineEntry.tsx`
- Create: `src/ui/guias/GuidelineEntry.css`
- Test: `src/ui/guias/GuidelineEntry.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `PRESETS`, `getPreset` de `../../presets`; `parseGuidelinesCsv` de `../../io/parseGuidelines`; `workbookToCsv` de `../../io/readExcel`.
- Produces: `GuidelineEntry` — tres acciones: elegir preset (botones por cada `PRESETS`), subir archivo (`<input type="file">` CSV/Excel), o empezar de cero (tabla vacía). Cada acción despacha `loadGuideline` al store.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/guias/GuidelineEntry.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { GuidelineEntry } from './GuidelineEntry'

function Probe() {
  const { state } = useProject()
  return <div data-testid="probe">{state.guidelineName || 'sin-guia'}:{state.guideline ? state.guideline.size : 0}</div>
}

function setup() {
  return render(
    <ProjectProvider>
      <GuidelineEntry />
      <Probe />
    </ProjectProvider>,
  )
}

describe('GuidelineEntry', () => {
  it('carga el preset CCME al hacer clic', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /CCME/i }))
    const probe = screen.getByTestId('probe')
    expect(probe.textContent).toMatch(/CCME/)
    expect(probe.textContent).not.toMatch(/:0$/) // trae parámetros
  })
  it('empieza de cero con una guía vacía', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /empezar de cero/i }))
    expect(screen.getByTestId('probe').textContent).toMatch(/:0$/)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/guias/GuidelineEntry.test.tsx`
Expected: FAIL "Cannot find module './GuidelineEntry'".

- [ ] **Step 3: Implementar `src/ui/guias/GuidelineEntry.tsx`**

```tsx
import { useRef } from 'react'
import { useProject } from '../../state/ProjectContext'
import { PRESETS } from '../../presets'
import { parseGuidelinesCsv } from '../../io/parseGuidelines'
import { workbookToCsv } from '../../io/readExcel'
import './GuidelineEntry.css'

export function GuidelineEntry() {
  const { dispatch } = useProject()
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isExcel = /\.xlsx?$/i.test(file.name)
    const csv = isExcel ? workbookToCsv(await file.arrayBuffer()) : await file.text()
    const { table } = parseGuidelinesCsv(csv)
    dispatch({ type: 'loadGuideline', table, name: file.name })
    e.target.value = ''
  }

  return (
    <section className="entry">
      <h2>Elige un punto de partida</h2>
      <div className="entry-grid">
        {PRESETS.map((p) => (
          <button key={p.id} className="entry-card" onClick={() => dispatch({ type: 'loadGuideline', table: p.table, name: p.name })}>
            <strong>{p.name}</strong>
            <span>{p.description}</span>
          </button>
        ))}
        <button className="entry-card" onClick={() => fileRef.current?.click()}>
          <strong>Subir mi archivo</strong>
          <span>Importa un Guidelines en CSV o Excel (.xlsx).</span>
        </button>
        <button className="entry-card" onClick={() => dispatch({ type: 'loadGuideline', table: new Map(), name: 'Nueva guía' })}>
          <strong>Empezar de cero</strong>
          <span>Crea una guía vacía y agrega parámetros.</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} />
    </section>
  )
}
```

- [ ] **Step 4: Crear `src/ui/guias/GuidelineEntry.css`**

```css
.entry h2 { font-size: 1.25rem; margin: 0 0 1rem; }
.entry-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; }
.entry-card {
  text-align: left; background: var(--card); border: 1px solid var(--line);
  border-radius: 12px; padding: 1.1rem; cursor: pointer; display: flex;
  flex-direction: column; gap: 0.4rem; color: var(--text);
}
.entry-card:hover { border-color: var(--accent); }
.entry-card strong { font-size: 1.05rem; }
.entry-card span { color: var(--muted); font-size: 0.9rem; line-height: 1.4; }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/guias/GuidelineEntry.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/ui/guias/GuidelineEntry.tsx src/ui/guias/GuidelineEntry.css src/ui/guias/GuidelineEntry.test.tsx
git commit -m "feat(ui): carga de guias desde preset, archivo o vacio"
```

---

### Task 5: Módulo Guías — editor de tabla

**Files:**
- Create: `src/ui/guias/ruleLabels.ts`
- Create: `src/ui/guias/GuidelineTableEditor.tsx`
- Create: `src/ui/guias/GuidelineTableEditor.css`
- Test: `src/ui/guias/ruleLabels.test.ts`
- Test: `src/ui/guias/GuidelineTableEditor.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `RuleType` de `../../engine/types`.
- Produces:
  - `RULE_LABELS: Record<RuleType, string>` y `ruleLabel(rt: RuleType): string` (etiqueta en español).
  - `GuidelineTableEditor` — renderiza una fila por cada `GuidelineRow` de la guía activa con campos editables (parámetro, tipo de regla, límite inferior/superior, unidad, fuente) y botón eliminar; cada edición despacha `setRow`/`removeParameter`.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/guias/ruleLabels.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { ruleLabel, RULE_LABELS } from './ruleLabels'

describe('ruleLabel', () => {
  it('traduce los tipos de regla al español', () => {
    expect(ruleLabel('max')).toBe('Máximo')
    expect(ruleLabel('min')).toBe('Mínimo')
    expect(ruleLabel('range')).toBe('Rango')
    expect(ruleLabel('cuHardness')).toBe('Por dureza (Cobre)')
    expect(ruleLabel('alPh')).toBe('Por pH (Aluminio)')
  })
  it('cubre los 12 tipos de regla', () => {
    expect(Object.keys(RULE_LABELS)).toHaveLength(12)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/guias/ruleLabels.test.ts`
Expected: FAIL "Cannot find module './ruleLabels'".

- [ ] **Step 3: Implementar `src/ui/guias/ruleLabels.ts`**

```ts
import type { RuleType } from '../../engine/types'

export const RULE_LABELS: Record<RuleType, string> = {
  max: 'Máximo',
  min: 'Mínimo',
  range: 'Rango',
  hardnessStep: 'Por dureza (escalones)',
  season: 'Estacional',
  ammonia: 'Amoníaco',
  alPh: 'Por pH (Aluminio)',
  cdHardness: 'Por dureza (Cadmio)',
  cuHardness: 'Por dureza (Cobre)',
  niHardness: 'Por dureza (Níquel)',
  pbHardness: 'Por dureza (Plomo)',
  znHardness: 'Por dureza (Zinc)',
}

export function ruleLabel(rt: RuleType): string {
  return RULE_LABELS[rt]
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/ui/guias/ruleLabels.test.ts`
Expected: PASS.

- [ ] **Step 5: Escribir la prueba que falla (`src/ui/guias/GuidelineTableEditor.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { GuidelineTableEditor } from './GuidelineTableEditor'
import type { GuidelineTable } from '../../engine/types'

function Seed() {
  const { dispatch } = useProject()
  function load() {
    const t: GuidelineTable = new Map([
      ['ARSENIC', [{ parameterId: 'ARSENIC', ruleType: 'max', lowerLimit: null, upperLimit: 5, unit: 'ug/L' }]],
    ])
    dispatch({ type: 'loadGuideline', table: t, name: 'x' })
  }
  return <button onClick={load}>seed</button>
}

async function setup() {
  render(
    <ProjectProvider>
      <Seed />
      <GuidelineTableEditor />
    </ProjectProvider>,
  )
  await userEvent.click(screen.getByText('seed'))
}

describe('GuidelineTableEditor', () => {
  it('muestra las filas de la guía activa', async () => {
    await setup()
    expect(screen.getByDisplayValue('ARSENIC')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })
  it('edita el límite superior', async () => {
    await setup()
    const input = screen.getByDisplayValue('5')
    await userEvent.clear(input)
    await userEvent.type(input, '10')
    expect((input as HTMLInputElement).value).toBe('10')
  })
  it('elimina un parámetro', async () => {
    await setup()
    await userEvent.click(screen.getByRole('button', { name: /eliminar/i }))
    expect(screen.queryByDisplayValue('ARSENIC')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Correr y verificar que falla**

Run: `npm test -- src/ui/guias/GuidelineTableEditor.test.tsx`
Expected: FAIL "Cannot find module './GuidelineTableEditor'".

- [ ] **Step 7: Implementar `src/ui/guias/GuidelineTableEditor.tsx`**

```tsx
import { useProject } from '../../state/ProjectContext'
import { RULE_LABELS } from './ruleLabels'
import type { RuleType } from '../../engine/types'
import './GuidelineTableEditor.css'

const RULE_TYPES = Object.keys(RULE_LABELS) as RuleType[]

function numOrNull(v: string): number | null {
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function GuidelineTableEditor() {
  const { state, dispatch } = useProject()
  if (!state.guideline) return null
  const entries = [...state.guideline.entries()]

  if (entries.length === 0) {
    return <p className="gte-empty">La guía no tiene parámetros todavía.</p>
  }

  return (
    <div className="gte-wrap">
      <table className="gte">
        <thead>
          <tr>
            <th>Parámetro</th><th>Tipo de regla</th><th>Límite inf.</th>
            <th>Límite sup.</th><th>Unidad</th><th>Fuente</th><th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([paramId, rows]) =>
            rows.map((r, i) => (
              <tr key={`${paramId}-${i}`}>
                <td>
                  <input value={r.parameterId} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { parameterId: e.target.value } })} />
                </td>
                <td>
                  <select value={r.ruleType} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { ruleType: e.target.value as RuleType } })}>
                    {RULE_TYPES.map((rt) => <option key={rt} value={rt}>{RULE_LABELS[rt]}</option>)}
                  </select>
                </td>
                <td>
                  <input value={r.lowerLimit ?? ''} inputMode="decimal" onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { lowerLimit: numOrNull(e.target.value) } })} />
                </td>
                <td>
                  <input value={r.upperLimit ?? ''} inputMode="decimal" onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { upperLimit: numOrNull(e.target.value) } })} />
                </td>
                <td>
                  <input value={r.unit ?? ''} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { unit: e.target.value } })} />
                </td>
                <td>
                  <input value={r.source ?? ''} onChange={(e) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { source: e.target.value } })} />
                </td>
                <td>
                  <button className="gte-del" aria-label={`Eliminar ${paramId}`} onClick={() => dispatch({ type: 'removeParameter', parameterId: paramId })}>✕</button>
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 8: Crear `src/ui/guias/GuidelineTableEditor.css`**

```css
.gte-wrap { overflow-x: auto; }
.gte { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.gte th { text-align: left; color: var(--muted); font-weight: 600; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--line); white-space: nowrap; }
.gte td { padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--line); }
.gte input, .gte select {
  width: 100%; min-width: 5rem; background: var(--card); color: var(--text);
  border: 1px solid var(--line); border-radius: 6px; padding: 0.35rem 0.5rem; font: inherit;
}
.gte input:focus, .gte select:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
.gte-del { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 1rem; }
.gte-del:hover { color: var(--accent2); }
.gte-empty { color: var(--muted); padding: 1rem 0; }
```

- [ ] **Step 9: Correr y verificar que pasa**

Run: `npm test -- src/ui/guias/GuidelineTableEditor.test.tsx`
Expected: PASS (3 pruebas).

- [ ] **Step 10: Commit**

```bash
git add src/ui/guias/ruleLabels.ts src/ui/guias/ruleLabels.test.ts src/ui/guias/GuidelineTableEditor.tsx src/ui/guias/GuidelineTableEditor.css src/ui/guias/GuidelineTableEditor.test.tsx
git commit -m "feat(ui): editor de tabla de guias con etiquetas de regla en espanol"
```

---

### Task 6: Módulo Guías — panel de validación en vivo

**Files:**
- Create: `src/ui/guias/ValidationPanel.tsx`
- Create: `src/ui/guias/ValidationPanel.css`
- Test: `src/ui/guias/ValidationPanel.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `validateGuidelines` de `../../validation/validateGuidelines`; `ValidationIssue` de `../../validation/types`.
- Produces: `ValidationPanel` — corre `validateGuidelines` sobre la guía activa (con `useMemo`) y muestra los issues agrupados por severidad (error 🔴 / aviso 🟡); si no hay issues, muestra "✅ La guía es válida".

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/guias/ValidationPanel.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { ValidationPanel } from './ValidationPanel'
import type { GuidelineTable } from '../../engine/types'

function Seed({ table }: { table: GuidelineTable }) {
  const { dispatch } = useProject()
  return <button onClick={() => dispatch({ type: 'loadGuideline', table, name: 'x' })}>seed</button>
}

async function setup(table: GuidelineTable) {
  render(
    <ProjectProvider>
      <Seed table={table} />
      <ValidationPanel />
    </ProjectProvider>,
  )
  await userEvent.click(screen.getByText('seed'))
}

describe('ValidationPanel', () => {
  it('muestra un error cuando una regla max no tiene límite', async () => {
    const t: GuidelineTable = new Map([['AS', [{ parameterId: 'AS', ruleType: 'max', lowerLimit: null, upperLimit: null, unit: 'ug/L' }]]])
    await setup(t)
    expect(screen.getByText(/límite superior/i)).toBeInTheDocument()
  })
  it('muestra que la guía es válida cuando no hay issues', async () => {
    const t: GuidelineTable = new Map([['AS', [{ parameterId: 'AS', ruleType: 'max', lowerLimit: null, upperLimit: 5, unit: 'ug/L' }]]])
    await setup(t)
    expect(screen.getByText(/válida/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/guias/ValidationPanel.test.tsx`
Expected: FAIL "Cannot find module './ValidationPanel'".

- [ ] **Step 3: Implementar `src/ui/guias/ValidationPanel.tsx`**

```tsx
import { useMemo } from 'react'
import { useProject } from '../../state/ProjectContext'
import { validateGuidelines } from '../../validation/validateGuidelines'
import './ValidationPanel.css'

export function ValidationPanel() {
  const { state } = useProject()
  const issues = useMemo(
    () => (state.guideline ? validateGuidelines(state.guideline) : []),
    [state.guideline],
  )

  if (!state.guideline) return null

  const errors = issues.filter((i) => i.severity === 'error')
  const warns = issues.filter((i) => i.severity === 'warn')

  if (issues.length === 0) {
    return <div className="vp vp-ok">✅ La guía es válida.</div>
  }

  return (
    <div className="vp">
      {errors.length > 0 && (
        <ul className="vp-list vp-errors">
          {errors.map((i, k) => <li key={`e${k}`}>🔴 {i.message}</li>)}
        </ul>
      )}
      {warns.length > 0 && (
        <ul className="vp-list vp-warns">
          {warns.map((i, k) => <li key={`w${k}`}>🟡 {i.message}</li>)}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/guias/ValidationPanel.css`**

```css
.vp { margin: 1rem 0; }
.vp-ok { color: var(--accent2); font-weight: 600; }
.vp-list { list-style: none; padding: 0.75rem 1rem; margin: 0 0 0.5rem; border-radius: 10px; border: 1px solid var(--line); }
.vp-list li { padding: 0.2rem 0; line-height: 1.4; font-size: 0.92rem; }
.vp-errors { background: rgba(192, 57, 43, 0.08); }
.vp-warns { background: rgba(241, 196, 15, 0.1); }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/guias/ValidationPanel.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 6: Commit**

```bash
git add src/ui/guias/ValidationPanel.tsx src/ui/guias/ValidationPanel.css src/ui/guias/ValidationPanel.test.tsx
git commit -m "feat(ui): panel de validacion en vivo de guias"
```

---

### Task 7: Ensamblar el Módulo Guías + exportar CSV

**Files:**
- Create: `src/ui/guias/GuiasModule.tsx`
- Create: `src/ui/guias/GuiasModule.css`
- Modify: `src/App.tsx`
- Test: `src/ui/guias/GuiasModule.test.tsx`

**Interfaces:**
- Consumes: `useProject`; `GuidelineEntry`, `GuidelineTableEditor`, `ValidationPanel`; `serializeGuidelinesCsv` de `../../io/serializeGuidelines`.
- Produces: `GuiasModule` — si no hay guía, muestra `GuidelineEntry`; si hay guía, muestra el editor + panel de validación + botón "Descargar CSV" + botón "Cambiar guía" (vuelve a la entrada). Se monta en el paso `guias` del `AppShell`.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/guias/GuiasModule.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider } from '../../state/ProjectContext'
import { GuiasModule } from './GuiasModule'

function setup() {
  render(
    <ProjectProvider>
      <GuiasModule />
    </ProjectProvider>,
  )
}

describe('GuiasModule', () => {
  it('muestra la entrada cuando no hay guía', () => {
    setup()
    expect(screen.getByText(/punto de partida/i)).toBeInTheDocument()
  })
  it('al elegir CCME muestra el editor y el botón de descarga', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /CCME/i }))
    expect(screen.getByRole('button', { name: /descargar csv/i })).toBeInTheDocument()
    // el editor muestra un parámetro conocido del CCME
    expect(screen.getByDisplayValue('ARSENIC_TOTAL_ugL')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/guias/GuiasModule.test.tsx`
Expected: FAIL "Cannot find module './GuiasModule'".

- [ ] **Step 3: Implementar `src/ui/guias/GuiasModule.tsx`**

```tsx
import { useProject } from '../../state/ProjectContext'
import { GuidelineEntry } from './GuidelineEntry'
import { GuidelineTableEditor } from './GuidelineTableEditor'
import { ValidationPanel } from './ValidationPanel'
import { serializeGuidelinesCsv } from '../../io/serializeGuidelines'
import './GuiasModule.css'

export function GuiasModule() {
  const { state, dispatch } = useProject()

  if (!state.guideline) return <GuidelineEntry />

  function download() {
    if (!state.guideline) return
    const csv = serializeGuidelinesCsv(state.guideline)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'guidelines.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="guias">
      <div className="guias-bar">
        <h2>{state.guidelineName || 'Guía'}</h2>
        <div className="guias-actions">
          <button className="btn" onClick={download}>Descargar CSV</button>
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'clear' })}>Cambiar guía</button>
        </div>
      </div>
      <ValidationPanel />
      <GuidelineTableEditor />
    </section>
  )
}
```

- [ ] **Step 4: Crear `src/ui/guias/GuiasModule.css`**

```css
.guias-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.guias-bar h2 { font-size: 1.2rem; margin: 0; }
.guias-actions { display: flex; gap: 0.5rem; }
.btn {
  background: var(--accent); color: #fff; border: none; border-radius: 8px;
  padding: 0.5rem 0.9rem; cursor: pointer; font: inherit; font-weight: 600;
}
.btn:hover { filter: brightness(1.08); }
.btn-ghost { background: none; color: var(--muted); border: 1px solid var(--line); }
.btn-ghost:hover { color: var(--text); filter: none; }
```

- [ ] **Step 5: Montar el módulo en el shell (`src/App.tsx`)**

```tsx
import { AppShell } from './ui/AppShell'
import { GuiasModule } from './ui/guias/GuiasModule'
import './App.css'

function App() {
  return <AppShell steps={{ guias: <GuiasModule /> }} />
}

export default App
```

- [ ] **Step 6: Correr la prueba, TODA la suite y el build**

Run: `npm test -- src/ui/guias/GuiasModule.test.tsx`
Expected: PASS (2 pruebas).

Run: `npm test`
Expected: PASS en todos los archivos (motor + io + presets + validación + ui).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 7: Commit**

```bash
git add src/ui/guias/GuiasModule.tsx src/ui/guias/GuiasModule.css src/App.tsx src/ui/guias/GuiasModule.test.tsx
git commit -m "feat(ui): ensamblar Modulo Guias (editor + validacion + exportar CSV)"
```

---

## Self-Review

**1. Cobertura del spec (§4 arquitectura, §6 Módulo Guías):**
- App shell con navegación de 4 pasos → Task 3. ✅
- `ProjectStore` (estado global, autoguardado se difiere a Fase 7) → Task 2. ✅
- Entrada: preset / subir archivo (CSV+Excel) / vacío → Task 4. ✅
- Editor de tabla con tipo de regla en desplegable español → Task 5. ✅
- Validación en vivo con severidades → Task 6. ✅
- Exportar CSV compatible (usa `serializeGuidelinesCsv`) → Task 7. ✅
- Reutiliza io/presets/validación sin modificarlos. ✅

**2. Placeholders:** ninguno; todo el código (TSX y CSS) está completo.

**3. Consistencia de tipos:** `StepId`, `ProjectState`/`ProjectAction` (Task 2) usados en Tasks 3–7; el editor despacha `setRow`/`removeParameter` con las firmas del reducer; `ValidationIssue` se consume desde `src/validation/types`. `serializeGuidelinesCsv`/`parseGuidelinesCsv`/`workbookToCsv`/`validateGuidelines` se consumen con las firmas de la Fase 2.

**Fuera de alcance (Fase 3B y siguientes):** asistente "agregar parámetro" con catálogo, validación de coherencia de unidades más rica, autoguardado en localStorage y proyecto `.ica.json` (Fase 7); Módulo Datos (Fase 4); Resultados (Fase 5); Ayuda (Fase 6). Nota: sin el asistente, agregar un parámetro nuevo desde cero se hará en la Fase 3B; en 3A el usuario parte de un preset o edita/borra filas.
