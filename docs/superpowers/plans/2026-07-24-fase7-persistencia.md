# Fase 7 — Persistencia (autoguardado + proyecto .ica.json) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el trabajo del usuario sobreviva a recargas (autoguardado en localStorage) y pueda exportarse/importarse como un archivo de proyecto `.ica.json`, con una nota de privacidad clara.

**Architecture:** Un (de)serializador puro `projectSerde` (maneja `Map`↔array y `Date`↔ISO, con `schemaVersion`), helpers de almacenamiento sobre localStorage, una acción `hydrate` en el reducer y su cableado en `ProjectProvider` (estado inicial desde storage + guardado en cada cambio), y un `ProjectMenu` (Exportar/Importar) en el `AppShell` con la nota de privacidad. Sin dependencias nuevas.

**Tech Stack:** React, Vite, TypeScript, Vitest, @testing-library/react.

## Global Constraints

- El motor `src/engine/` y las capas `src/io`, `src/presets`, `src/validation`, `src/results` NO se modifican. Esta fase SÍ extiende el estado (`src/state/`) y el shell (`src/ui/AppShell.tsx`), de forma intencional y acotada a la persistencia.
- Idioma español; todo en el navegador; tokens CSS de `src/App.css`; sin dependencias nuevas.
- La (de)serialización debe preservar exactamente la guía (`GuidelineTable`) y los datos (`DataRow[]` con `Date`), y tolerar JSON inválido sin romper (fallback a estado inicial).
- Las pruebas verifican comportamiento observable / round-trip.

---

### Task 1: (De)serialización de proyecto (`projectSerde`)

**Files:**
- Create: `src/state/projectSerde.ts`
- Test: `src/state/projectSerde.test.ts`

**Interfaces:**
- Consumes: `ProjectState` de `./projectReducer`; `GuidelineTable`, `DataRow` de `../engine/types`.
- Produces:
  - `serializeProject(state: ProjectState): string`
  - `deserializeProject(json: string): ProjectState` (rehidrata `Map` y `Date`; lanza si el JSON es inválido).

- [ ] **Step 1: Escribir la prueba que falla (`src/state/projectSerde.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { serializeProject, deserializeProject } from './projectSerde'
import type { ProjectState } from './projectReducer'
import type { GuidelineTable, DataRow } from '../engine/types'

const gl: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])
const state: ProjectState = {
  guideline: gl,
  guidelineName: 'CCME',
  data: [{ station: 'S1', date: new Date(2020, 0, 15), values: { TP: '0.02' } }],
  dataColumns: ['TP'],
  dataName: 'd.csv',
}

describe('projectSerde', () => {
  it('round-trip conserva guía, datos, fechas y nombres', () => {
    const back = deserializeProject(serializeProject(state))
    expect(back.guidelineName).toBe('CCME')
    expect(back.guideline!.get('TP')![0].upperLimit).toBe(0.05)
    expect(back.dataColumns).toEqual(['TP'])
    expect(back.data![0].station).toBe('S1')
    expect(back.data![0].date).toBeInstanceOf(Date)
    expect(back.data![0].date!.getFullYear()).toBe(2020)
  })
  it('serializa a JSON con schemaVersion', () => {
    const o = JSON.parse(serializeProject(state))
    expect(o.schemaVersion).toBe(1)
  })
  it('lanza con JSON inválido', () => {
    expect(() => deserializeProject('no es json')).toThrow()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/state/projectSerde.test.ts`
Expected: FAIL "Cannot find module './projectSerde'".

- [ ] **Step 3: Implementar `src/state/projectSerde.ts`**

```ts
import type { ProjectState } from './projectReducer'
import type { GuidelineTable, DataRow } from '../engine/types'

interface SerializedRow {
  station: string
  date: string | null
  values: Record<string, string>
}
interface SerializedProject {
  schemaVersion: 1
  guideline: [string, unknown][] | null
  guidelineName: string
  data: SerializedRow[] | null
  dataColumns: string[]
  dataName: string
}

export function serializeProject(state: ProjectState): string {
  const payload: SerializedProject = {
    schemaVersion: 1,
    guideline: state.guideline ? [...state.guideline.entries()] : null,
    guidelineName: state.guidelineName,
    data: state.data
      ? state.data.map((r) => ({
          station: r.station,
          date: r.date ? r.date.toISOString() : null,
          values: r.values,
        }))
      : null,
    dataColumns: state.dataColumns,
    dataName: state.dataName,
  }
  return JSON.stringify(payload)
}

export function deserializeProject(json: string): ProjectState {
  const o = JSON.parse(json) as SerializedProject
  const guideline: GuidelineTable | null = o.guideline
    ? new Map(o.guideline as [string, never][])
    : null
  const data: DataRow[] | null = o.data
    ? o.data.map((r) => ({ station: r.station, date: r.date ? new Date(r.date) : null, values: r.values }))
    : null
  return {
    guideline,
    guidelineName: o.guidelineName ?? '',
    data,
    dataColumns: o.dataColumns ?? [],
    dataName: o.dataName ?? '',
  }
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/state/projectSerde.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/state/projectSerde.ts src/state/projectSerde.test.ts
git commit -m "feat(state): (de)serializacion de proyecto (.ica.json) con Map/Date y schemaVersion"
```

---

### Task 2: Acción `hydrate` + almacenamiento en localStorage

**Files:**
- Modify: `src/state/projectReducer.ts`
- Test: `src/state/projectReducer.test.ts` (agregar prueba de `hydrate`; no quitar las existentes)
- Create: `src/state/projectStorage.ts`
- Test: `src/state/projectStorage.test.ts`

**Interfaces:**
- Consumes: `ProjectState`, `serializeProject`, `deserializeProject`.
- Produces:
  - Acción `{ type: 'hydrate'; state: ProjectState }` que reemplaza el estado completo.
  - `saveToStorage(state: ProjectState): void` y `loadFromStorage(): ProjectState | null` (clave `ica.project.v1`; tolerantes a errores/JSON inválido → null).

- [ ] **Step 1: Agregar la prueba de `hydrate` (`src/state/projectReducer.test.ts`)**

Dentro del `describe('projectReducer', ...)` existente, agrega:

```ts
  it('hydrate reemplaza el estado completo', () => {
    const t = table([row({ parameterId: 'AS', upperLimit: 5 })])
    const nuevo = { guideline: t, guidelineName: 'X', data: null, dataColumns: [], dataName: '' }
    const s = projectReducer(initialState, { type: 'hydrate', state: nuevo })
    expect(s.guidelineName).toBe('X')
    expect(s.guideline!.get('AS')![0].upperLimit).toBe(5)
  })
```

- [ ] **Step 2: Correr y verificar que la nueva falla**

Run: `npm test -- src/state/projectReducer.test.ts`
Expected: FAIL en la prueba nueva (acción `hydrate` desconocida).

- [ ] **Step 3: Agregar la acción `hydrate` en `src/state/projectReducer.ts`**

En la unión `ProjectAction`, agrega (antes de `clear`):

```ts
  | { type: 'hydrate'; state: ProjectState }
```

En el `switch`, agrega (antes de `clear`):

```ts
    case 'hydrate':
      return action.state
```

- [ ] **Step 4: Correr y verificar que las del reducer pasan**

Run: `npm test -- src/state/projectReducer.test.ts`
Expected: PASS (las existentes + la nueva).

- [ ] **Step 5: Escribir la prueba que falla (`src/state/projectStorage.test.ts`)**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { saveToStorage, loadFromStorage } from './projectStorage'
import type { ProjectState } from './projectReducer'
import type { GuidelineTable } from '../engine/types'

const gl: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])
const state: ProjectState = { guideline: gl, guidelineName: 'CCME', data: null, dataColumns: [], dataName: '' }

describe('projectStorage', () => {
  beforeEach(() => localStorage.clear())

  it('guarda y recupera el estado', () => {
    saveToStorage(state)
    const back = loadFromStorage()
    expect(back!.guidelineName).toBe('CCME')
    expect(back!.guideline!.get('TP')![0].upperLimit).toBe(0.05)
  })
  it('devuelve null si no hay nada guardado', () => {
    expect(loadFromStorage()).toBeNull()
  })
  it('devuelve null si el contenido está corrupto', () => {
    localStorage.setItem('ica.project.v1', 'basura')
    expect(loadFromStorage()).toBeNull()
  })
})
```

- [ ] **Step 6: Correr y verificar que falla**

Run: `npm test -- src/state/projectStorage.test.ts`
Expected: FAIL "Cannot find module './projectStorage'".

- [ ] **Step 7: Implementar `src/state/projectStorage.ts`**

```ts
import type { ProjectState } from './projectReducer'
import { serializeProject, deserializeProject } from './projectSerde'

const KEY = 'ica.project.v1'

export function saveToStorage(state: ProjectState): void {
  try {
    localStorage.setItem(KEY, serializeProject(state))
  } catch {
    // almacenamiento no disponible o lleno: se ignora
  }
}

export function loadFromStorage(): ProjectState | null {
  try {
    const s = localStorage.getItem(KEY)
    return s ? deserializeProject(s) : null
  } catch {
    return null
  }
}
```

- [ ] **Step 8: Correr y verificar que pasa**

Run: `npm test -- src/state/projectStorage.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 9: Commit**

```bash
git add src/state/projectReducer.ts src/state/projectReducer.test.ts src/state/projectStorage.ts src/state/projectStorage.test.ts
git commit -m "feat(state): accion hydrate y almacenamiento en localStorage"
```

---

### Task 3: Cablear el autoguardado en `ProjectProvider`

**Files:**
- Modify: `src/state/ProjectContext.tsx`
- Test: `src/state/ProjectContext.test.tsx`

**Interfaces:**
- Consumes: `loadFromStorage`, `saveToStorage`.
- Produces: `ProjectProvider` inicializa el estado desde localStorage (o `initialState`) y guarda en cada cambio.

- [ ] **Step 1: Escribir la prueba que falla (`src/state/ProjectContext.test.tsx`)**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from './ProjectContext'
import type { GuidelineTable } from '../engine/types'

function Panel() {
  const { state, dispatch } = useProject()
  const gl: GuidelineTable = new Map([['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 }]]])
  return (
    <div>
      <button onClick={() => dispatch({ type: 'loadGuideline', table: gl, name: 'CCME' })}>cargar</button>
      <span data-testid="name">{state.guidelineName || '—'}</span>
    </div>
  )
}

describe('ProjectProvider autoguardado', () => {
  beforeEach(() => localStorage.clear())

  it('persiste el estado y lo restaura en un proveedor nuevo', async () => {
    const first = render(<ProjectProvider><Panel /></ProjectProvider>)
    await userEvent.click(screen.getByText('cargar'))
    expect(screen.getByTestId('name').textContent).toBe('CCME')
    first.unmount()

    // Un proveedor nuevo (simula recargar) debe restaurar desde localStorage
    render(<ProjectProvider><Panel /></ProjectProvider>)
    expect(screen.getByTestId('name').textContent).toBe('CCME')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/state/ProjectContext.test.tsx`
Expected: FAIL (el segundo proveedor muestra "—" porque aún no hay persistencia).

- [ ] **Step 3: Modificar `src/state/ProjectContext.tsx`**

Reemplaza el contenido por:

```tsx
import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { projectReducer, initialState, type ProjectState, type ProjectAction } from './projectReducer'
import { loadFromStorage, saveToStorage } from './projectStorage'

interface ProjectContextValue {
  state: ProjectState
  dispatch: React.Dispatch<ProjectAction>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, null, () => loadFromStorage() ?? initialState)

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  return <ProjectContext.Provider value={{ state, dispatch }}>{children}</ProjectContext.Provider>
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject debe usarse dentro de <ProjectProvider>')
  return ctx
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/state/ProjectContext.test.tsx`
Expected: PASS.

- [ ] **Step 5: Correr TODA la suite (regresión de los módulos que usan el proveedor)**

Run: `npm test`
Expected: PASS en todos los archivos. (Nota: si alguna prueba previa asumía estado limpio y ahora ve estado persistido, revisar; los tests usan proveedores frescos y localStorage de jsdom se comparte por archivo — si hay interferencia, añadir `localStorage.clear()` en el `beforeEach` del archivo afectado, sin cambiar la lógica de producción.)

- [ ] **Step 6: Commit**

```bash
git add src/state/ProjectContext.tsx src/state/ProjectContext.test.tsx
git commit -m "feat(state): autoguardado del proyecto en localStorage (inicializa y persiste)"
```

---

### Task 4: Menú de proyecto (Exportar/Importar) + nota de privacidad

**Files:**
- Create: `src/ui/ProjectMenu.tsx`
- Create: `src/ui/ProjectMenu.css`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/ui/AppShell.css`
- Test: `src/ui/ProjectMenu.test.tsx`
- Test: `src/ui/AppShell.test.tsx` (agregar prueba de la nota de privacidad; no quitar las existentes)

**Interfaces:**
- Consumes: `useProject`; `serializeProject`, `deserializeProject` de `../state/projectSerde`.
- Produces: `ProjectMenu` (botón "Exportar" que descarga `proyecto.ica.json`; botón "Importar" que lee un `.json` y despacha `hydrate`); se coloca en el encabezado del `AppShell`, que además muestra una nota de privacidad.

- [ ] **Step 1: Escribir la prueba que falla (`src/ui/ProjectMenu.test.tsx`)**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../state/ProjectContext'
import { serializeProject } from '../state/projectSerde'
import { ProjectMenu } from './ProjectMenu'
import type { GuidelineTable } from '../engine/types'

function Probe() {
  const { state } = useProject()
  return <span data-testid="name">{state.guidelineName || '—'}</span>
}

describe('ProjectMenu', () => {
  beforeEach(() => localStorage.clear())

  it('muestra los botones de exportar e importar', () => {
    render(<ProjectProvider><ProjectMenu /><Probe /></ProjectProvider>)
    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /importar/i })).toBeInTheDocument()
  })
  it('importa un proyecto .ica.json y lo carga en el estado', async () => {
    const gl: GuidelineTable = new Map([['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 }]]])
    const json = serializeProject({ guideline: gl, guidelineName: 'Importado', data: null, dataColumns: [], dataName: '' })
    render(<ProjectProvider><ProjectMenu /><Probe /></ProjectProvider>)
    const file = new File([json], 'proyecto.ica.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(screen.getByTestId('name').textContent).toBe('Importado')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/ui/ProjectMenu.test.tsx`
Expected: FAIL "Cannot find module './ProjectMenu'".

- [ ] **Step 3: Implementar `src/ui/ProjectMenu.tsx`**

```tsx
import { useRef } from 'react'
import { useProject } from '../state/ProjectContext'
import { serializeProject, deserializeProject } from '../state/projectSerde'
import './ProjectMenu.css'

export function ProjectMenu() {
  const { state, dispatch } = useProject()
  const fileRef = useRef<HTMLInputElement>(null)

  function exportProject() {
    const blob = new Blob([serializeProject(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'proyecto.ica.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async function importProject(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      dispatch({ type: 'hydrate', state: deserializeProject(await file.text()) })
    } catch {
      // archivo inválido: se ignora silenciosamente
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="pm">
      <button className="pm-btn" onClick={exportProject}>Exportar</button>
      <button className="pm-btn" onClick={() => fileRef.current?.click()}>Importar</button>
      <input ref={fileRef} type="file" accept=".json,.ica.json,application/json" hidden onChange={importProject} aria-label="Importar proyecto" />
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/ui/ProjectMenu.css`**

```css
.pm { margin-left: auto; display: flex; gap: 0.4rem; }
.pm-btn { background: none; color: var(--muted); border: 1px solid var(--line); border-radius: 8px; padding: 0.35rem 0.7rem; cursor: pointer; font: inherit; font-size: 0.85rem; }
.pm-btn:hover { color: var(--text); }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npm test -- src/ui/ProjectMenu.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 6: Integrar en `src/ui/AppShell.tsx` (encabezado + nota de privacidad)**

Lee el archivo. Agrega el import:

```tsx
import { ProjectMenu } from './ProjectMenu'
```

En el `<header className="shell-header">`, agrega `<ProjectMenu />` como último hijo (después del `shell-title`):

```tsx
      <header className="shell-header">
        <span className="shell-brand">ICA</span>
        <span className="shell-title">Índice de Calidad del Agua</span>
        <ProjectMenu />
      </header>
```

Y justo antes de cerrar el `</div>` raíz `.shell` (después del `<main>…</main>`), agrega la nota de privacidad:

```tsx
      <p className="shell-privacy">Tus datos se procesan y se guardan solo en tu navegador; nada se sube a ningún servidor.</p>
```

- [ ] **Step 7: Agregar estilo en `src/ui/AppShell.css`**

```css
.shell-privacy { color: var(--muted); font-size: 0.8rem; text-align: center; margin-top: 2rem; }
```

- [ ] **Step 8: Agregar la prueba de la nota de privacidad (`src/ui/AppShell.test.tsx`)**

Dentro del `describe` existente, agrega:

```tsx
  it('muestra la nota de privacidad', () => {
    render(<AppShell />)
    expect(screen.getByText(/solo en tu navegador/i)).toBeInTheDocument()
  })
```

(Nota: `AppShell` ahora usa `useProject` a través de `ProjectMenu`, así que las pruebas de `AppShell` deben renderizarlo dentro de `<ProjectProvider>`. Si las pruebas existentes de `AppShell.test.tsx` renderizan `<AppShell />` sin proveedor, envuélvelas en `<ProjectProvider>` — importándolo de `../state/ProjectContext` — sin cambiar sus aserciones.)

- [ ] **Step 9: Correr la prueba, TODA la suite y el build**

Run: `npm test -- src/ui/AppShell.test.tsx`
Expected: PASS (las existentes envueltas en el proveedor + la nueva).

Run: `npm test`
Expected: PASS en todos los archivos.

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 10: Commit**

```bash
git add src/ui/ProjectMenu.tsx src/ui/ProjectMenu.css src/ui/AppShell.tsx src/ui/AppShell.css src/ui/ProjectMenu.test.tsx src/ui/AppShell.test.tsx
git commit -m "feat(ui): menu de proyecto (exportar/importar .ica.json) y nota de privacidad"
```

---

## Self-Review

**1. Cobertura del spec (§10 Persistencia):**
- Autoguardado en localStorage (inicializa y persiste) → Tasks 2, 3. ✅
- Proyecto `.ica.json` con `schemaVersion`, export/import → Tasks 1, 4. ✅
- Preserva `Map`/`Date` en el round-trip → Task 1. ✅
- Nota de privacidad ("solo en tu navegador") → Task 4. ✅
- Sin cuentas ni servidor. ✅

**2. Placeholders:** ninguno; todo el código está completo.

**3. Consistencia de tipos:** `serializeProject`/`deserializeProject` operan sobre `ProjectState` (Task 1) y se consumen en `projectStorage` (Task 2) y `ProjectMenu` (Task 4); la acción `hydrate` (Task 2) la despacha el import (Task 4); `ProjectProvider` (Task 3) usa los helpers de storage. La clave de localStorage `ica.project.v1` es consistente entre storage y las pruebas.

**Nota de compatibilidad de pruebas:** al agregar autoguardado y hacer que `AppShell` dependa de `useProject`, algunas pruebas existentes pueden necesitar (a) `localStorage.clear()` en su `beforeEach` para aislarse, y (b) envolver `<AppShell />` en `<ProjectProvider>`. Estos son ajustes de prueba, no de lógica de producción.

**Fuera de alcance:** exportación a PDF/PNG de resultados; sincronización en la nube/cuentas; los pulidos diferidos acumulados (a11y, contraste, plantilla México a verificar).
