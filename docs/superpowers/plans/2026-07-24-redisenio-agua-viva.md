# Rediseño visual «Agua viva» · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el rediseño «Agua viva» (spec aprobado en `docs/superpowers/specs/2026-07-24-redisenio-agua-viva-design.md`) a los 4 módulos de ICA: sistema de tokens propio, tema claro/oscuro con botón, cabecera con stepper de progreso, y reskin completo de Guías, Datos, Resultados y Ayuda — sin tocar la lógica de negocio.

**Architecture:** Todo el valor visual vive en `src/styles/tokens.css` (variables CSS en `:root` y `:root[data-theme='dark']`); los componentes solo consumen tokens. Tema vía atributo `data-theme` en `<html>` + script anti-flash en `index.html` + hook `useTheme`. Estado de avance del stepper derivado de las validaciones existentes (`getStepStatus`). Navegación entre módulos vía `StepNavContext` provisto por `AppShell`.

**Tech Stack:** React 19 + TypeScript + Vite, Vitest + @testing-library/react (jsdom), oxlint. CSS moderno puro (`color-mix`, custom properties). **Cero dependencias de runtime nuevas** (fuentes Inter autoalojadas en `public/fonts/`).

**Spec:** `docs/superpowers/specs/2026-07-24-redisenio-agua-viva-design.md`

## Global Constraints

- **No se toca** `src/engine/**`, `src/io/**`, `src/validation/**`, `src/presets/**`, `src/examples/**`, `src/state/**`. Excepción única en lógica: `src/results/categoryInfo.ts` (se sustituye `categoryColor` por `categoryClass`).
- **Cero dependencias nuevas** en `package.json` (ni runtime ni dev).
- **Textos de UI en español sin cambios** salvo los prefijos de icono de validación (✅/🔴/🟡 → ✓/✕/⚠), aprobado en el spec §5.1.
- Los tests consultan por texto/roles, nunca por clases CSS nuevas (las clases nuevas solo se usan en tests donde el plan lo indica explícitamente).
- Ningún valor literal de color/sombra/radio fuera de `tokens.css` (excepción: `transparent` y `currentColor`).
- Los tokens `--cat-*` (semáforo de calidad del agua) nunca se mezclan con los de marca (`--primary`/`--accent`); la marca nunca comunica estado del agua.
- Comandos de verificación (en `/home/oscolv/ia/wqi/ica`): `npm run test`, `npm run lint`, `npm run build`. Node ≥ 22.12.
- Commit tras cada tarea en verde: `git add -A && git commit -m "..."`.

---

### Task 1: Fundamentos — fuentes, tokens, base y anti-flash

**Files:**
- Create: `public/fonts/inter-latin-wght-normal.woff2`, `public/fonts/inter-latin-ext-wght-normal.woff2` (descarga)
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Modify: `index.html`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx` (quitar `import './App.css'`)
- Delete: `src/index.css`, `src/App.css`

**Interfaces:**
- Produce: todos los tokens CSS (`--bg`, `--bg2`, `--card`, `--field`, `--text`, `--muted`, `--primary`, `--primary-ink`, `--accent`, `--line`, `--ok`/`--ok-bg`, `--warn`/`--warn-bg`, `--err`/`--err-bg`, `--cat-*`, `--series-1..6`, `--r-ctl`, `--r-card`, `--shadow`, `--shadow-sm`, `--speed`), las clases de mapeo `.cat-excelente|buena|regular|marginal|mala`, y los componentes compartidos `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-ghost`, `.chip`/`.chip-ok`/`.chip-warn`/`.chip-err`/`.chip-cat`, `.card`. Alias heredado `--accent2: var(--accent)` (se elimina en Task 8).

- [ ] **Step 1: Descargar las fuentes Inter autoalojadas**

```bash
cd /home/oscolv/ia/wqi/ica
mkdir -p public/fonts
curl -sSL -o public/fonts/inter-latin-wght-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2
curl -sSL -o public/fonts/inter-latin-ext-wght-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-ext-wght-normal.woff2
ls -la public/fonts/
```

Expected: dos archivos `.woff2` no vacíos (~100–300 KB cada uno). Si la red falla, reintentar; no continuar sin las fuentes.

- [ ] **Step 2: Crear `src/styles/tokens.css`**

```css
/* ============================================================
   ICA · tokens de diseño — dirección «Agua viva»
   Todos los valores visuales viven aquí; los componentes solo
   consumen variables, nunca valores literales.
   ============================================================ */

:root {
  /* fondo y superficies */
  --bg: #eef7f7;
  --bg2: #e9f3f9;
  --card: #ffffff;
  --field: #ffffff;

  /* tinta */
  --text: #0f2e3d;
  --muted: #5b7a89;

  /* marca (nunca comunica calidad del agua) */
  --primary: #0e7490;
  --primary-ink: #ffffff;
  --accent: #0d9488;

  /* bordes */
  --line: #d7e5ea;

  /* semánticos de validación */
  --ok: #15803d;
  --ok-bg: rgba(34, 197, 94, 0.12);
  --warn: #92600a;
  --warn-bg: rgba(234, 179, 8, 0.16);
  --err: #b91c1c;
  --err-bg: rgba(220, 38, 38, 0.12);

  /* categorías del WQI (semáforo exclusivo de calidad del agua) */
  --cat-excelente: #0f766e;
  --cat-excelente-ink: #ffffff;
  --cat-buena: #22c55e;
  --cat-buena-ink: #ffffff;
  --cat-regular: #eab308;
  --cat-regular-ink: #1f2937;
  --cat-marginal: #f97316;
  --cat-marginal-ink: #ffffff;
  --cat-mala: #dc2626;
  --cat-mala-ink: #ffffff;

  /* series de gráficas */
  --series-1: #0e7490;
  --series-2: #dc2626;
  --series-3: #0f766e;
  --series-4: #7c3aed;
  --series-5: #ea580c;
  --series-6: #0369a1;

  /* forma y elevación */
  --r-ctl: 10px;
  --r-card: 16px;
  --shadow: 0 8px 24px rgba(15, 46, 61, 0.07);
  --shadow-sm: 0 2px 8px rgba(15, 46, 61, 0.08);

  /* movimiento */
  --speed: 150ms;

  /* alias heredado del tema viejo; se elimina en la tarea de pulido */
  --accent2: var(--accent);
}

:root[data-theme='dark'] {
  --bg: #0a1a23;
  --bg2: #0c2231;
  --card: #10293a;
  --field: #0c2231;

  --text: #d9edf2;
  --muted: #7fa3b3;

  --primary: #2dd4bf;
  --primary-ink: #06302b;
  --accent: #14b8a6;

  --line: #1f3f52;

  --ok: #4ade80;
  --ok-bg: rgba(74, 222, 128, 0.14);
  --warn: #facc15;
  --warn-bg: rgba(250, 204, 21, 0.14);
  --err: #f87171;
  --err-bg: rgba(248, 113, 113, 0.14);

  --cat-excelente: #5eead4;
  --cat-excelente-ink: #06302b;
  --cat-buena: #4ade80;
  --cat-buena-ink: #052e16;
  --cat-regular: #facc15;
  --cat-regular-ink: #422006;
  --cat-marginal: #fb923c;
  --cat-marginal-ink: #431407;
  --cat-mala: #f87171;
  --cat-mala-ink: #450a0a;

  --series-1: #2dd4bf;
  --series-2: #f87171;
  --series-3: #4ade80;
  --series-4: #c4b5fd;
  --series-5: #fb923c;
  --series-6: #7dd3fc;

  --shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Clases de mapeo de categoría: fijan --cat / --cat-ink en el elemento.
   Uso: className="chip chip-cat cat-buena" */
.cat-excelente { --cat: var(--cat-excelente); --cat-ink: var(--cat-excelente-ink); }
.cat-buena { --cat: var(--cat-buena); --cat-ink: var(--cat-buena-ink); }
.cat-regular { --cat: var(--cat-regular); --cat-ink: var(--cat-regular-ink); }
.cat-marginal { --cat: var(--cat-marginal); --cat-ink: var(--cat-marginal-ink); }
.cat-mala { --cat: var(--cat-mala); --cat-ink: var(--cat-mala-ink); }
```

- [ ] **Step 3: Crear `src/styles/base.css`**

```css
/* ============================================================
   ICA · base — reset mínimo, tipografía, foco y componentes
   compartidos (botones, chips, tarjeta).
   ============================================================ */

/* Inter autoalojada (variable, pesos 100–900) — cero CDNs en runtime */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/inter-latin-wght-normal.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+2000-206F;
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/inter-latin-ext-wght-normal.woff2') format('woff2');
  unicode-range: U+0100-024F, U+1E00-1EFF;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(160deg, var(--bg), var(--bg2)) fixed;
  color: var(--text);
  min-height: 100vh;
}

/* números tabulares en datos */
table,
input,
select,
.num {
  font-feature-settings: 'tnum';
}

/* foco visible en todos los controles */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 6px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* ---------- botones ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: var(--r-ctl);
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  transition: filter var(--speed), background var(--speed), color var(--speed), border-color var(--speed);
}
.btn-primary {
  background: var(--primary);
  color: var(--primary-ink);
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover {
  filter: brightness(1.08);
}
.btn-secondary {
  background: var(--card);
  color: var(--primary);
  border: 1px solid var(--line);
}
.btn-secondary:hover {
  border-color: var(--primary);
}
.btn-ghost {
  background: none;
  color: var(--muted);
}
.btn-ghost:hover {
  color: var(--text);
}

/* ---------- chips ---------- */
.chip {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: color-mix(in srgb, var(--muted) 14%, transparent);
  color: var(--muted);
}
.chip-ok { background: var(--ok-bg); color: var(--ok); }
.chip-warn { background: var(--warn-bg); color: var(--warn); }
.chip-err { background: var(--err-bg); color: var(--err); }
.chip-cat { background: var(--cat); color: var(--cat-ink); }

/* ---------- tarjeta flotante ---------- */
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
}
```

- [ ] **Step 4: Anti-flash de tema + preload de fuentes en `index.html`**

Reemplazar el `<head>` completo por:

```html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="ICA — Índice de Calidad del Agua. Calcula el CCME Water Quality Index en tu navegador: guías, validación de datos, cálculo, gráficas y comunicación." />
    <script>
      try {
        var t = localStorage.getItem('ica-theme')
        document.documentElement.dataset.theme = t === 'dark' || t === 'light' ? t : 'light'
      } catch (e) {
        document.documentElement.dataset.theme = 'light'
      }
    </script>
    <link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/inter-latin-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin />
    <title>ICA — Índice de Calidad del Agua</title>
  </head>
```

- [ ] **Step 5: Apuntar `main.tsx` a los nuevos estilos y limpiar los viejos**

En `src/main.tsx`, reemplazar `import './index.css'` por:

```tsx
import './styles/tokens.css'
import './styles/base.css'
```

En `src/App.tsx`, eliminar la línea `import './App.css'`.

```bash
cd /home/oscolv/ia/wqi/ica
grep -rn "\.wrap\|\.hero\|\.brand\|\.badge\|\.lead\|\.foot\b\|card-n" src --include="*.tsx" | grep -v "shell-brand"
```

Expected: sin coincidencias (esas clases de `App.css` ya no se usan en ningún TSX; `shell-brand` es de AppShell y se mantiene). Si apareciera alguna, NO borrar `App.css` y avisar antes de continuar.

```bash
rm src/index.css src/App.css
```

- [ ] **Step 6: Verificar build y tests**

Run: `npm run test && npm run build`
Expected: tests en verde; build sin errores. (En este punto la app se ve con tokens nuevos pero CSS de módulos viejo consumiendo variables que ya existen — `--accent`, `--accent2`, `--bg`, etc. — así que nada se rompe visualmente de forma grave.)

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(diseño): tokens «Agua viva», base CSS, Inter autoalojada y anti-flash de tema"
```

---

### Task 2: Lógica de tema (claro/oscuro)

**Files:**
- Create: `src/ui/theme.ts`
- Test: `src/ui/theme.test.ts`

**Interfaces:**
- Produce: `type Theme = 'light' | 'dark'`; `getStoredTheme(): Theme`; `applyTheme(theme: Theme): void`; `useTheme(): [Theme, () => void]`. Lo consume `AppShell` (Task 3). Clave de localStorage: `'ica-theme'`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/ui/theme.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { getStoredTheme, applyTheme, useTheme } from './theme'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('theme', () => {
  it('usa tema claro cuando no hay preferencia guardada', () => {
    expect(getStoredTheme()).toBe('light')
  })
  it('lee la preferencia guardada', () => {
    localStorage.setItem('ica-theme', 'dark')
    expect(getStoredTheme()).toBe('dark')
  })
  it('applyTheme fija data-theme y persiste la elección', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('ica-theme')).toBe('dark')
  })
  it('useTheme alterna el tema', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current[0]).toBe('light')
    act(() => result.current[1]())
    expect(result.current[0]).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    act(() => result.current[1]())
    expect(result.current[0]).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/ui/theme.test.ts`
Expected: FAIL (`Cannot find module './theme'`).

- [ ] **Step 3: Implementar `src/ui/theme.ts`**

```ts
import { useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'ica-theme'

export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // almacenamiento no disponible: el tema vive solo en el documento
  }
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return [theme, toggle]
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/ui/theme.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(diseño): lógica de tema claro/oscuro con persistencia"
```

---

### Task 3: AppShell — cabecera, stepper con ✓ y botón de tema

**Files:**
- Create: `src/ui/stepNav.ts`
- Create: `src/ui/stepStatus.ts`
- Test: `src/ui/stepStatus.test.ts`
- Modify: `src/ui/AppShell.tsx` (reescritura)
- Modify: `src/ui/AppShell.css` (reescritura)
- Modify: `src/ui/ProjectMenu.css` (reescritura)
- Modify: `src/ui/AppShell.test.tsx` (reescritura)

**Interfaces:**
- Consume: `useTheme` de `./theme` (Task 2); `useProject` de `../state/ProjectContext`; `initialState`/`ProjectState` de `../state/projectReducer`; `validateGuidelines` de `../validation/validateGuidelines`; `validateData` de `../validation/validateData`.
- Produce: `StepId = 'guias' | 'datos' | 'resultados' | 'ayuda'`, `StepNav = (step: StepId) => void`, `StepNavContext`, `useStepNav(): StepNav | null` (lo consume `DataValidationPanel` en Task 5); `getStepStatus(state: ProjectState): { guias: boolean; datos: boolean }`.

- [ ] **Step 1: Crear `src/ui/stepNav.ts`**

```ts
import { createContext, useContext } from 'react'

export type StepId = 'guias' | 'datos' | 'resultados' | 'ayuda'
export type StepNav = (step: StepId) => void

export const StepNavContext = createContext<StepNav | null>(null)

export function useStepNav(): StepNav | null {
  return useContext(StepNavContext)
}
```

- [ ] **Step 2: Escribir el test de `getStepStatus` que falla**

Crear `src/ui/stepStatus.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getStepStatus } from './stepStatus'
import { initialState } from '../state/projectReducer'
import type { GuidelineTable, DataRow } from '../engine/types'

const okTable: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])
const badTable: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: null, unit: 'mg/L' }]],
])
// cuHardness calcula su límite desde la dureza: la guía es válida pero los
// datos sin columna de dureza producen un ERROR de validación de datos.
const cuTable: GuidelineTable = new Map([
  ['CU', [{ parameterId: 'CU', ruleType: 'cuHardness', lowerLimit: null, upperLimit: null, unit: 'ug/L' }]],
])
const rows: DataRow[] = [{ station: 'S1', date: null, values: { TP: '0.02' } }]
const columns = ['TP']

describe('getStepStatus', () => {
  it('estado inicial: nada completo', () => {
    expect(getStepStatus(initialState)).toEqual({ guias: false, datos: false })
  })
  it('guía vacía no cuenta como completa', () => {
    expect(getStepStatus({ ...initialState, guideline: new Map() }).guias).toBe(false)
  })
  it('guía válida sin datos: solo guías completo', () => {
    expect(getStepStatus({ ...initialState, guideline: okTable })).toEqual({ guias: true, datos: false })
  })
  it('guía con errores no marca nada', () => {
    const s = getStepStatus({ ...initialState, guideline: badTable, data: rows, dataColumns: columns })
    expect(s).toEqual({ guias: false, datos: false })
  })
  it('guía válida + datos sin errores: ambos completos', () => {
    const s = getStepStatus({ ...initialState, guideline: okTable, data: rows, dataColumns: columns })
    expect(s).toEqual({ guias: true, datos: true })
  })
  it('guía válida + datos con error de validación: datos incompleto', () => {
    const cuRows: DataRow[] = [{ station: 'S1', date: null, values: { CU: '5' } }]
    const s = getStepStatus({ ...initialState, guideline: cuTable, data: cuRows, dataColumns: ['CU'] })
    expect(s).toEqual({ guias: true, datos: false })
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `npx vitest run src/ui/stepStatus.test.ts`
Expected: FAIL (`Cannot find module './stepStatus'`).

- [ ] **Step 4: Implementar `src/ui/stepStatus.ts`**

```ts
import type { ProjectState } from '../state/projectReducer'
import { validateGuidelines } from '../validation/validateGuidelines'
import { validateData } from '../validation/validateData'

export interface StepStatus {
  guias: boolean
  datos: boolean
}

export function getStepStatus(state: ProjectState): StepStatus {
  const guias =
    !!state.guideline &&
    state.guideline.size > 0 &&
    !validateGuidelines(state.guideline).some((i) => i.severity === 'error')
  const datos =
    guias &&
    !!state.data &&
    !validateData(state.data, state.dataColumns, state.guideline!).issues.some(
      (i) => i.severity === 'error',
    )
  return { guias, datos }
}
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npx vitest run src/ui/stepStatus.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 6: Reescribir `src/ui/AppShell.test.tsx` (los 3 tests actuales + 2 nuevos, falla al principio)**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { AyudaModule } from './ayuda/AyudaModule'
import { ProjectProvider } from '../state/ProjectContext'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('AppShell', () => {
  it('muestra el paso Guías por defecto y permite cambiar de pestaña', async () => {
    render(
      <ProjectProvider>
        <AppShell steps={{ guias: <p>contenido guias</p>, datos: <p>contenido datos</p> }} />,
      </ProjectProvider>,
    )
    expect(screen.getByText('contenido guias')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /datos/i }))
    expect(screen.getByText('contenido datos')).toBeInTheDocument()
  })
  it('muestra marcador "próximamente" para pasos sin contenido', () => {
    render(
      <ProjectProvider>
        <AppShell />
      </ProjectProvider>,
    )
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument()
  })
  it('muestra la nota de privacidad', () => {
    render(
      <ProjectProvider>
        <AppShell />
      </ProjectProvider>,
    )
    expect(screen.getByText(/solo en tu navegador/i)).toBeInTheDocument()
  })
  it('alterna el tema claro/oscuro y lo persiste', async () => {
    render(
      <ProjectProvider>
        <AppShell />
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /cambiar a tema oscuro/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('ica-theme')).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: /cambiar a tema claro/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('ica-theme')).toBe('light')
  })
  it('marca con ✓ las pestañas de guías y datos tras cargar el ejemplo', async () => {
    render(
      <ProjectProvider>
        <AppShell steps={{ ayuda: <AyudaModule /> }} />
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByRole('tab', { name: /ayuda/i }))
    await userEvent.click(screen.getByRole('button', { name: /cargar ejemplo/i }))
    expect(screen.getByRole('tab', { name: /guías/i }).className).toContain('is-done')
    expect(screen.getByRole('tab', { name: /datos/i }).className).toContain('is-done')
  })
})
```

- [ ] **Step 7: Ejecutar y verificar que los 2 tests nuevos fallan**

Run: `npx vitest run src/ui/AppShell.test.tsx`
Expected: los 3 viejos PASS; «alterna el tema…» FAIL (no existe botón de tema); «marca con ✓…» FAIL (no hay `is-done`).

- [ ] **Step 8: Reescribir `src/ui/AppShell.tsx`**

```tsx
import { Fragment, useState, type ReactNode } from 'react'
import { ProjectMenu } from './ProjectMenu'
import { useTheme } from './theme'
import { useProject } from '../state/ProjectContext'
import { getStepStatus } from './stepStatus'
import { StepNavContext, type StepId } from './stepNav'
import './AppShell.css'

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
  const [theme, toggleTheme] = useTheme()
  const { state } = useProject()
  const status = getStepStatus(state)
  const content = steps[active]

  return (
    <div className="shell">
      <header className="shell-header">
        <span className="shell-brand">ICA</span>
        <span className="shell-title">Índice de Calidad del Agua</span>
        <div className="shell-actions">
          <ProjectMenu />
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>
      <nav className="shell-nav" role="tablist" aria-label="Pasos">
        {STEPS.map((s, i) => {
          const done = (s.id === 'guias' && status.guias) || (s.id === 'datos' && status.datos)
          return (
            <Fragment key={s.id}>
              {i > 0 && (
                <span className="shell-step-sep" aria-hidden="true">
                  —
                </span>
              )}
              <button
                role="tab"
                aria-selected={active === s.id}
                className={`shell-tab${active === s.id ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                onClick={() => setActive(s.id)}
              >
                <span className="shell-tab-n">{done ? '✓' : s.n}</span> {s.label}
              </button>
            </Fragment>
          )
        })}
      </nav>
      <main className="shell-main" role="tabpanel">
        <StepNavContext.Provider value={setActive}>
          {content ?? <p className="shell-placeholder">Este paso estará disponible próximamente.</p>}
        </StepNavContext.Provider>
      </main>
      <p className="shell-privacy">
        Tus datos se procesan y se guardan solo en tu navegador; nada se sube a ningún servidor.
      </p>
    </div>
  )
}
```

Nota: `StepId` deja de exportarse desde `AppShell.tsx` (ahora vive en `stepNav.ts`); ningún otro archivo lo importa (verificado con grep).

- [ ] **Step 9: Reescribir `src/ui/AppShell.css`**

```css
.shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.25rem 3rem;
}
.shell-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0 0.9rem;
}
.shell-brand {
  font-weight: 800;
  letter-spacing: 0.14em;
  font-size: 0.85rem;
  color: var(--primary-ink);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
}
.shell-title {
  font-weight: 700;
  font-size: 1.05rem;
}
.shell-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.theme-toggle {
  font: inherit;
  font-size: 1rem;
  line-height: 1;
  background: var(--card);
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.4rem 0.55rem;
  cursor: pointer;
  transition: color var(--speed), border-color var(--speed);
}
.theme-toggle:hover {
  color: var(--primary);
  border-color: var(--primary);
}
.shell-nav {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.4rem;
  overflow-x: auto;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
}
.shell-step-sep {
  color: var(--line);
  flex: none;
}
.shell-tab {
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  color: var(--muted);
  transition: background var(--speed), color var(--speed), box-shadow var(--speed);
}
.shell-tab:hover {
  color: var(--text);
}
.shell-tab.is-active {
  background: var(--primary);
  color: var(--primary-ink);
  box-shadow: var(--shadow-sm);
}
.shell-tab.is-done {
  background: var(--ok-bg);
  color: var(--ok);
}
.shell-tab.is-done.is-active {
  background: var(--primary);
  color: var(--primary-ink);
}
.shell-main {
  min-height: 40vh;
}
.shell-placeholder {
  color: var(--muted);
  padding: 2rem 0;
  text-align: center;
}
.shell-privacy {
  color: var(--muted);
  font-size: 0.8rem;
  text-align: center;
  margin-top: 2.5rem;
}
```

- [ ] **Step 10: Reescribir `src/ui/ProjectMenu.css`**

(El TSX no cambia; `.pm` pierde el `margin-left: auto` porque ahora lo alinea `.shell-actions`.)

```css
.pm {
  display: flex;
  gap: 0.4rem;
}
.pm-btn {
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--card);
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
  transition: color var(--speed), border-color var(--speed);
}
.pm-btn:hover {
  color: var(--text);
  border-color: var(--primary);
}
```

- [ ] **Step 11: Verificar tests, lint y build**

Run: `npm run test && npm run lint && npm run build`
Expected: todo en verde (5 tests de AppShell PASS).

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "feat(diseño): AppShell con stepper de progreso, botón de tema y StepNavContext"
```

---

### Task 4: Módulo Guías

**Files:**
- Modify: `src/ui/guias/GuiasModule.tsx` (clases de botones)
- Modify: `src/ui/guias/GuiasModule.css` (reescritura)
- Modify: `src/ui/guias/ValidationPanel.tsx` (banners con ✓/✕/⚠)
- Modify: `src/ui/guias/ValidationPanel.css` (reescritura)
- Modify: `src/ui/guias/GuidelineTableEditor.tsx` (`NumberCell` con `disabled`)
- Modify: `src/ui/guias/GuidelineTableEditor.css` (reescritura)
- Test: `src/ui/guias/GuidelineTableEditor.test.tsx` (añadir 1 test)
- Modify: `src/ui/guias/GuidelineEntry.css` (reescritura)
- Modify: `src/ui/guias/AddParameterForm.tsx` (clases de botones)
- Modify: `src/ui/guias/AddParameterForm.css` (reescritura)

**Interfaces:**
- Consume: `.btn*`, `.card`, tokens y `.chip` de Task 1.
- Produce: nada nuevo para otras tareas.

- [ ] **Step 1: Añadir el test que falla a `GuidelineTableEditor.test.tsx`**

Agregar dentro del `describe('GuidelineTableEditor')` (la seed existente carga ARSENIC con regla `max` y límite superior 5):

```tsx
  it('desactiva el límite que no aplica al tipo de regla', async () => {
    await setup()
    const na = document.querySelector('.gte input.is-na') as HTMLInputElement
    expect(na).toBeDisabled()
    expect(screen.getByDisplayValue('5')).toBeEnabled()
  })
```

Run: `npx vitest run src/ui/guias/GuidelineTableEditor.test.tsx`
Expected: el test nuevo FAIL (no existe `.is-na`); los demás PASS.

- [ ] **Step 2: `GuidelineTableEditor.tsx` — `NumberCell` con `disabled`**

Reemplazar el componente `NumberCell` por:

```tsx
function NumberCell({
  value,
  onCommit,
  disabled,
}: {
  value: number | null
  onCommit: (v: number | null) => void
  disabled?: boolean
}) {
  const [text, setText] = useState(value == null ? '' : String(value))
  useEffect(() => {
    setText(value == null ? '' : String(value))
  }, [value])
  return (
    <input
      value={text}
      inputMode="decimal"
      disabled={disabled}
      className={disabled ? 'is-na' : undefined}
      placeholder={disabled ? '—' : undefined}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(numOrNull(text))}
    />
  )
}
```

Y en la tabla, las dos celdas de límites pasan `disabled` según el tipo de regla:

```tsx
                <td>
                  <NumberCell
                    value={r.lowerLimit}
                    disabled={r.ruleType === 'max'}
                    onCommit={(v) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { lowerLimit: v } })}
                  />
                </td>
                <td>
                  <NumberCell
                    value={r.upperLimit}
                    disabled={r.ruleType === 'min'}
                    onCommit={(v) => dispatch({ type: 'setRow', parameterId: paramId, index: i, patch: { upperLimit: v } })}
                  />
                </td>
```

Run: `npx vitest run src/ui/guias/GuidelineTableEditor.test.tsx`
Expected: 5 tests PASS.

- [ ] **Step 3: Reescribir `src/ui/guias/GuidelineTableEditor.css`**

```css
.gte-wrap {
  overflow-x: auto;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
}
.gte {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.gte th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--card) 60%, var(--bg));
}
.gte td {
  padding: 0.35rem 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
}
.gte tbody tr:hover td {
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}
.gte input,
.gte select {
  width: 100%;
  min-width: 5rem;
  font: inherit;
  background: var(--field);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.35rem 0.5rem;
}
.gte input:hover,
.gte select:hover {
  border-color: var(--primary);
}
.gte input.is-na {
  background: transparent;
  border-style: dashed;
  border-color: var(--muted);
  opacity: 0.7;
}
.gte-del {
  font: inherit;
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
  padding: 0.15rem 0.4rem;
  opacity: 0;
  transition: opacity var(--speed), color var(--speed), background var(--speed);
}
.gte tr:hover .gte-del,
.gte-del:focus-visible {
  opacity: 1;
}
.gte-del:hover {
  color: var(--err);
  background: var(--err-bg);
}
.gte-empty {
  color: var(--muted);
  padding: 1rem 0;
}
```

- [ ] **Step 4: `GuiasModule.tsx` — clases de botones**

En la barra de acciones, reemplazar los tres botones por:

```tsx
          <button className="btn btn-primary" onClick={() => setShowAdd((v) => !v)}>Agregar parámetro</button>
          <button className="btn btn-secondary" onClick={download}>Descargar CSV</button>
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'clear' })}>Cambiar guía</button>
```

- [ ] **Step 5: Reescribir `src/ui/guias/GuiasModule.css`**

(Las clases `.btn*` ahora viven en `base.css`; aquí solo queda el layout del módulo.)

```css
.guias-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.guias-bar h2 {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
}
.guias-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
```

- [ ] **Step 6: `ValidationPanel.tsx` — banners**

Reemplazar el bloque de retorno «válida» y los prefijos de las listas:

```tsx
  if (issues.length === 0) {
    return <div className="vp vp-banner vp-ok">✓ La guía es válida.</div>
  }

  return (
    <div className="vp">
      {errors.length > 0 && (
        <ul className="vp-list vp-errors">
          {errors.map((i, k) => <li key={`e${k}`}>✕ {i.message}</li>)}
        </ul>
      )}
      {warns.length > 0 && (
        <ul className="vp-list vp-warns">
          {warns.map((i, k) => <li key={`w${k}`}>⚠ {i.message}</li>)}
        </ul>
      )}
    </div>
  )
```

- [ ] **Step 7: Reescribir `src/ui/guias/ValidationPanel.css`**

```css
.vp {
  margin: 0.75rem 0 1rem;
}
.vp-banner {
  border-radius: 12px;
  padding: 0.6rem 0.85rem;
  font-weight: 600;
  font-size: 0.9rem;
}
.vp-ok {
  background: var(--ok-bg);
  color: var(--ok);
  border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent);
}
.vp-list {
  list-style: none;
  margin: 0 0 0.5rem;
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  font-size: 0.875rem;
  display: grid;
  gap: 0.35rem;
}
.vp-errors {
  background: var(--err-bg);
  color: var(--err);
  border: 1px solid color-mix(in srgb, var(--err) 35%, transparent);
}
.vp-warns {
  background: var(--warn-bg);
  color: var(--warn);
  border: 1px solid color-mix(in srgb, var(--warn) 35%, transparent);
}
```

- [ ] **Step 8: Reescribir `src/ui/guias/GuidelineEntry.css`**

(El TSX no cambia; `.entry-error` pasa a usar `--err`.)

```css
.entry h2 {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0 0 1rem;
}
.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}
.entry-card {
  text-align: left;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
  padding: 1.1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: var(--text);
  font: inherit;
  transition: border-color var(--speed), transform var(--speed);
}
.entry-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}
.entry-card strong {
  font-size: 1.05rem;
}
.entry-card span {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.4;
}
.entry-error {
  color: var(--err);
  margin-top: 0.75rem;
  font-size: 0.9rem;
}
```

- [ ] **Step 9: `AddParameterForm.tsx` — clases de botones**

Reemplazar los dos botones de `.apf-actions` por:

```tsx
        <button className="btn btn-primary" onClick={submit}>Agregar</button>
        <button className="btn btn-ghost" onClick={onDone}>Cancelar</button>
```

- [ ] **Step 10: Reescribir `src/ui/guias/AddParameterForm.css`**

```css
.apf {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
  padding: 1rem;
  margin-bottom: 1rem;
}
.apf-row {
  margin-bottom: 0.75rem;
}
.apf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.6rem;
}
.apf label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}
.apf input,
.apf select {
  font: inherit;
  background: var(--field);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.4rem 0.5rem;
}
.apf input:hover,
.apf select:hover {
  border-color: var(--primary);
}
.apf-error {
  color: var(--err);
  font-size: 0.9rem;
  margin: 0.75rem 0 0;
}
.apf-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.9rem;
}
```

- [ ] **Step 11: Verificar tests, lint y build**

Run: `npm run test && npm run lint && npm run build`
Expected: todo en verde.

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "feat(diseño): módulo Guías con tarjeta flotante, banners de validación y límites N/A atenuados"
```

---

### Task 5: Módulo Datos

**Files:**
- Modify: `src/ui/datos/DataEntry.tsx` (dropzone con arrastrar/soltar)
- Modify: `src/ui/datos/DataEntry.css` (reescritura)
- Test: `src/ui/datos/DatosModule.test.tsx` (añadir 1 test de drop)
- Modify: `src/ui/datos/DataValidationPanel.tsx` (chips + banner CTA)
- Modify: `src/ui/datos/DataValidationPanel.css` (reescritura)
- Test: `src/ui/datos/DataValidationPanel.test.tsx` (añadir 1 test de navegación)
- Modify: `src/ui/datos/DataPreview.tsx` (chip de valores censurados)
- Modify: `src/ui/datos/DataPreview.css` (reescritura)
- Modify: `src/ui/datos/DatosModule.tsx` (clase de botón)
- Modify: `src/ui/datos/DatosModule.css` (reescritura)

**Interfaces:**
- Consume: `useStepNav`/`StepNavContext` de Task 3 (uso null-safe: si no hay provider, no se muestra el botón CTA y los tests viejos siguen pasando).
- Produce: nada nuevo para otras tareas.

- [ ] **Step 1: Añadir el test de drop que falla a `DatosModule.test.tsx`**

Agregar `fireEvent` al import de `@testing-library/react` y añadir dentro del `describe('DatosModule')`:

```tsx
  it('carga un CSV soltándolo en la zona de arrastre', async () => {
    setup()
    const csv = 'Station,Date,DO\nS1,2020-01-01,7\n'
    const file = new File([csv], 'd.csv', { type: 'text/csv' })
    fireEvent.drop(document.querySelector('.dentry-drop')!, {
      dataTransfer: { files: [file] },
    })
    expect(await screen.findByText(/1 filas/)).toBeInTheDocument()
  })
```

Run: `npx vitest run src/ui/datos/DatosModule.test.tsx`
Expected: el test nuevo FAIL (`document.querySelector('.dentry-drop')` es null); los demás PASS.

- [ ] **Step 2: Reescribir `src/ui/datos/DataEntry.tsx` con dropzone**

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
  const [dragging, setDragging] = useState(false)

  async function readFile(file: File) {
    try {
      const isExcel = /\.xlsx?$/i.test(file.name)
      const csv = isExcel ? workbookToCsv(await file.arrayBuffer()) : await file.text()
      const { rows, columns, issues } = parseDataCsv(csv)
      if (issues.some((i) => i.row === 1)) {
        setError('El archivo no tiene las columnas requeridas Station y Date (formato ancho).')
        return
      }
      if (rows.length === 0) {
        setError('El archivo no contiene filas de datos.')
        return
      }
      dispatch({ type: 'loadData', rows, columns, name: file.name })
      setError(null)
    } catch {
      setError('No se pudo leer el archivo. Verifica que sea un CSV o Excel (.xlsx) válido.')
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await readFile(file)
    e.target.value = ''
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await readFile(file)
  }

  return (
    <section className="dentry">
      <h2>Sube tus datos de monitoreo</h2>
      <p className="dentry-help">
        Formato ancho: columnas <code>Station</code>, <code>Date</code> y una columna por parámetro.
        Acepta CSV o Excel (.xlsx). Los valores bajo el límite de detección pueden escribirse como <code>&lt;0.01</code>.
      </p>
      <div
        className={`dentry-drop${dragging ? ' is-drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span className="dentry-drop-icon" aria-hidden="true">⬆</span>
        <span className="dentry-drop-text">Arrastra tu archivo aquí, o</span>
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>Elegir archivo</button>
      </div>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} aria-label="Subir archivo de datos" />
      {error && <p className="dentry-error" role="alert">{error}</p>}
    </section>
  )
}
```

Run: `npx vitest run src/ui/datos/DatosModule.test.tsx`
Expected: 3 tests PASS.

- [ ] **Step 3: Reescribir `src/ui/datos/DataEntry.css`**

```css
.dentry h2 {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
}
.dentry-help {
  color: var(--muted);
  max-width: 620px;
  line-height: 1.55;
  margin: 0 0 1.25rem;
}
.dentry code {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.05rem 0.3rem;
  font-size: 0.85em;
}
.dentry-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.2rem 1.5rem;
  border: 2px dashed var(--line);
  border-radius: var(--r-card);
  background: color-mix(in srgb, var(--card) 55%, transparent);
  text-align: center;
  transition: border-color var(--speed), background var(--speed);
}
.dentry-drop.is-drag {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.dentry-drop-icon {
  font-size: 1.6rem;
  color: var(--primary);
}
.dentry-drop-text {
  color: var(--muted);
  font-size: 0.9rem;
}
.dentry-error {
  color: var(--err);
  font-weight: 600;
  margin-top: 0.75rem;
  font-size: 0.9rem;
}
```

- [ ] **Step 4: Añadir el test de navegación que falla a `DataValidationPanel.test.tsx`**

Agregar `vi` al import de `vitest`, importar `StepNavContext`, y añadir dentro del `describe('DataValidationPanel')`:

```tsx
  it('el botón «Ir a Resultados» navega al paso ③', async () => {
    const goTo = vi.fn()
    const t: GuidelineTable = new Map([
      ['DO', [{ parameterId: 'DO', ruleType: 'min', lowerLimit: 5, upperLimit: null, unit: 'mg/L' }]],
    ])
    render(
      <ProjectProvider>
        <StepNavContext.Provider value={goTo}>
          <Seed table={t} rows={[{ station: 'S1', date: null, values: { DO: '7' } }]} columns={['DO']} />
          <DataValidationPanel />
        </StepNavContext.Provider>
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByText('seed'))
    await userEvent.click(screen.getByRole('button', { name: /ir a resultados/i }))
    expect(goTo).toHaveBeenCalledWith('resultados')
  })
```

Los imports del archivo quedan:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { StepNavContext } from '../stepNav'
import { DataValidationPanel } from './DataValidationPanel'
import type { GuidelineTable, DataRow } from '../../engine/types'
```

Run: `npx vitest run src/ui/datos/DataValidationPanel.test.tsx`
Expected: el test nuevo FAIL (no existe botón «Ir a Resultados»); los 3 viejos PASS.

- [ ] **Step 5: Reescribir `src/ui/datos/DataValidationPanel.tsx`**

```tsx
import { useMemo } from 'react'
import { useProject } from '../../state/ProjectContext'
import { validateData } from '../../validation/validateData'
import { useStepNav } from '../stepNav'
import './DataValidationPanel.css'

export function DataValidationPanel() {
  const { state } = useProject()
  const goTo = useStepNav()
  const result = useMemo(() => {
    if (!state.data || !state.guideline) return null
    return validateData(state.data, state.dataColumns, state.guideline)
  }, [state.data, state.dataColumns, state.guideline])

  if (!state.data) return null
  if (!state.guideline) {
    return <div className="dvp-banner dvp-warnline">⚠ Carga una guía en el paso ① antes de validar los datos.</div>
  }
  if (!result) return null

  const errors = result.issues.filter((i) => i.severity === 'error')
  const warns = result.issues.filter((i) => i.severity === 'warn')

  return (
    <div className="dvp">
      <div className="dvp-summary">
        <span className="chip chip-ok">✓ {result.matched.length} emparejados</span>
        <span className="chip">◦ {result.dataWithoutGuideline.length} datos sin guía</span>
        <span className="chip">◦ {result.guidelineWithoutData.length} guías sin datos</span>
      </div>
      {errors.length > 0 && (
        <ul className="dvp-list dvp-errors">{errors.map((i, k) => <li key={`e${k}`}>✕ {i.message}</li>)}</ul>
      )}
      {warns.length > 0 && (
        <ul className="dvp-list dvp-warns">{warns.map((i, k) => <li key={`w${k}`}>⚠ {i.message}</li>)}</ul>
      )}
      {errors.length === 0 ? (
        <div className="dvp-banner dvp-ready">
          <span>✓ Listo para calcular el WQI.</span>
          {goTo && (
            <button className="btn btn-primary" onClick={() => goTo('resultados')}>Ir a Resultados ③</button>
          )}
        </div>
      ) : (
        <div className="dvp-banner dvp-blocked">Corrige los errores ✕ antes de calcular.</div>
      )}
    </div>
  )
}
```

Run: `npx vitest run src/ui/datos/DataValidationPanel.test.tsx`
Expected: 4 tests PASS.

- [ ] **Step 6: Reescribir `src/ui/datos/DataValidationPanel.css`**

```css
.dvp {
  margin: 0.75rem 0 1rem;
  display: grid;
  gap: 0.6rem;
}
.dvp-summary {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.dvp-list {
  list-style: none;
  margin: 0;
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  font-size: 0.875rem;
  display: grid;
  gap: 0.35rem;
}
.dvp-errors {
  background: var(--err-bg);
  color: var(--err);
  border: 1px solid color-mix(in srgb, var(--err) 35%, transparent);
}
.dvp-warns {
  background: var(--warn-bg);
  color: var(--warn);
  border: 1px solid color-mix(in srgb, var(--warn) 35%, transparent);
}
.dvp-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-radius: 12px;
  padding: 0.6rem 0.85rem;
  font-weight: 600;
  font-size: 0.9rem;
}
.dvp-banner .btn {
  margin-left: auto;
}
.dvp-ready {
  background: var(--ok-bg);
  color: var(--ok);
  border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent);
}
.dvp-blocked {
  background: var(--err-bg);
  color: var(--err);
  border: 1px solid color-mix(in srgb, var(--err) 35%, transparent);
}
.dvp-warnline {
  background: var(--warn-bg);
  color: var(--warn);
  border: 1px solid color-mix(in srgb, var(--warn) 35%, transparent);
  margin: 0.75rem 0 1rem;
}
```

- [ ] **Step 7: `DataPreview.tsx` — chip de valores censurados**

Reemplazar la celda de valores dentro del `tbody`:

```tsx
              {state.dataColumns.map((c) => {
                const v = r.values[c] ?? ''
                const censored = /^[L<]/.test(v.trim())
                return <td key={c}>{censored ? <span className="dprev-cens">{v}</span> : v}</td>
              })}
```

- [ ] **Step 8: Reescribir `src/ui/datos/DataPreview.css`**

```css
.dprev-wrap {
  overflow-x: auto;
  margin-top: 1rem;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
}
.dprev {
  border-collapse: collapse;
  font-size: 0.85rem;
  white-space: nowrap;
}
.dprev th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--card) 60%, var(--bg));
}
.dprev td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
}
.dprev-cens {
  background: color-mix(in srgb, var(--muted) 14%, transparent);
  border-radius: 6px;
  padding: 0.05rem 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.dprev-more {
  color: var(--muted);
  font-size: 0.8rem;
  margin: 0;
  padding: 0.5rem 0.75rem;
}
```

- [ ] **Step 9: `DatosModule.tsx` + `DatosModule.css`**

En `DatosModule.tsx`, reemplazar `className="dbtn-ghost"` por `className="btn btn-ghost"`.

Reescribir `DatosModule.css`:

```css
.datos-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.datos-bar h2 {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
}
```

- [ ] **Step 10: Verificar tests, lint y build**

Run: `npm run test && npm run lint && npm run build`
Expected: todo en verde.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat(diseño): módulo Datos con dropzone, banner CTA a Resultados y chips de censurados"
```

---

### Task 6: Módulo Resultados

**Files:**
- Modify: `src/results/categoryInfo.ts` (`categoryClass` en vez de `categoryColor`)
- Test: `src/results/categoryInfo.test.ts` (reescritura)
- Modify: `src/ui/resultados/GaugeCard.tsx` (gradiente + animación + chip de categoría)
- Modify: `src/ui/resultados/GaugeCard.css` (reescritura)
- Modify: `src/ui/resultados/FactorBars.tsx` (tooltips por factor)
- Modify: `src/ui/resultados/FactorBars.css` (reescritura)
- Modify: `src/ui/resultados/Heatmap.css` (reescritura)
- Modify: `src/ui/resultados/TrendChart.tsx` (series por clase, sin hex)
- Modify: `src/ui/resultados/TrendChart.css` (reescritura)
- Modify: `src/ui/resultados/ResultadosModule.tsx` (clase de botón)
- Modify: `src/ui/resultados/ResultadosModule.css` (reescritura)

**Interfaces:**
- Consume: clases `.cat-*` (fijan `--cat`/`--cat-ink`), tokens `--series-*`, `.chip .chip-cat` de Task 1.
- Produce: `categoryClass(category: string): string` en `src/results/categoryInfo.ts` (valores: `'cat-excelente' | 'cat-buena' | 'cat-regular' | 'cat-marginal' | 'cat-mala'`). `categoryColor` desaparece — su único consumidor es `GaugeCard` (verificado con grep).

- [ ] **Step 1: Reescribir `src/results/categoryInfo.test.ts` (falla)**

```ts
import { describe, it, expect } from 'vitest'
import { categoryLabelEs, categoryClass } from './categoryInfo'

describe('categoryInfo', () => {
  it('traduce las categorías al español', () => {
    expect(categoryLabelEs('Excellent')).toBe('Excelente')
    expect(categoryLabelEs('Good')).toBe('Buena')
    expect(categoryLabelEs('Fair')).toBe('Regular')
    expect(categoryLabelEs('Marginal')).toBe('Marginal')
    expect(categoryLabelEs('Poor')).toBe('Mala')
  })
  it('asigna la clase CSS de cada categoría', () => {
    expect(categoryClass('Excellent')).toBe('cat-excelente')
    expect(categoryClass('Good')).toBe('cat-buena')
    expect(categoryClass('Fair')).toBe('cat-regular')
    expect(categoryClass('Marginal')).toBe('cat-marginal')
    expect(categoryClass('Poor')).toBe('cat-mala')
  })
})
```

Run: `npx vitest run src/results/categoryInfo.test.ts`
Expected: FAIL (`categoryClass` no exportada).

- [ ] **Step 2: Reescribir `src/results/categoryInfo.ts`**

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

export function categoryClass(category: string): string {
  switch (category) {
    case 'Excellent': return 'cat-excelente'
    case 'Good': return 'cat-buena'
    case 'Fair': return 'cat-regular'
    case 'Marginal': return 'cat-marginal'
    default: return 'cat-mala' // Poor
  }
}
```

Run: `npx vitest run src/results/categoryInfo.test.ts`
Expected: 2 tests PASS. (En este punto `GaugeCard.tsx` no compila porque importa `categoryColor` — se arregla en el paso siguiente, antes de correr la suite completa.)

- [ ] **Step 3: Reescribir `src/ui/resultados/GaugeCard.tsx`**

```tsx
import { useEffect, useId, useState } from 'react'
import type { StationResult } from '../../engine/types'
import { categoryLabelEs, categoryClass } from '../../results/categoryInfo'
import { buildNarrative } from '../../results/narrative'
import './GaugeCard.css'

// Medidor semicircular: arco de (20,100) a (180,100), radio 80.
const ARC = 'M 20 100 A 80 80 0 0 1 180 100'
const CIRC = Math.PI * 80 // longitud del semicírculo

export function GaugeCard({ result }: { result: StationResult }) {
  const gid = useId()
  const pct = Math.max(0, Math.min(100, result.wqi))
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(t)
  }, [])
  const offset = CIRC * (1 - (shown ? pct : 0) / 100)

  return (
    <article className={`gcard ${categoryClass(result.category)}`}>
      <h3 className="gcard-station">{result.station}</h3>
      <div className="gcard-gauge">
        <svg viewBox="0 0 200 120" width="200" height="120" role="img" aria-label={`WQI ${result.wqi.toFixed(0)}, ${categoryLabelEs(result.category)}`}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="gstop-a" />
              <stop offset="1" className="gstop-b" />
            </linearGradient>
          </defs>
          <path d={ARC} fill="none" className="garc-track" strokeWidth="14" strokeLinecap="round" />
          <path
            d={ARC}
            fill="none"
            stroke={`url(#${gid})`}
            className="garc-prog"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
          <text x="100" y="94" textAnchor="middle" className="gcard-value">{result.wqi.toFixed(0)}</text>
        </svg>
      </div>
      <div className="gcard-cat chip chip-cat">{categoryLabelEs(result.category)}</div>
      <p className="gcard-narrative">{buildNarrative(result)}</p>
    </article>
  )
}
```

Notas:
- La clase `.cat-*` en el `<article>` fija `--cat`/`--cat-ink` para todo el gauge (arco, número y chip heredan el semáforo sin un solo hex en el TSX).
- La animación de montaje va de 0 a `pct` vía transición CSS de `stroke-dashoffset`; `prefers-reduced-motion` la anula (regla global de `base.css`).
- `useId` da un id de gradiente único por tarjeta (varias estaciones en pantalla).

- [ ] **Step 4: Reescribir `src/ui/resultados/GaugeCard.css`**

```css
.gcard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-align: center;
}
.gcard-station {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}
.gcard-gauge {
  line-height: 0;
}
.garc-track {
  stroke: color-mix(in srgb, var(--line) 70%, transparent);
}
.garc-prog {
  transition: stroke-dashoffset 0.7s ease-out;
}
.gstop-a {
  stop-color: var(--cat);
}
.gstop-b {
  stop-color: var(--cat);
  stop-opacity: 0.55;
}
.gcard-value {
  font-size: 2.1rem;
  font-weight: 800;
  fill: var(--cat);
}
.gcard-cat {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.gcard-narrative {
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.5;
  max-width: 38ch;
  margin: 0.5rem auto 0;
}
```

- [ ] **Step 5: `FactorBars.tsx` — tooltips por factor**

Reemplazar el arreglo `factors` y la fila:

```tsx
  const factors = [
    { key: 'F1', label: 'F1 · Alcance', value: result.f1, tip: 'Porcentaje de parámetros que incumplen su guía al menos una vez.' },
    { key: 'F2', label: 'F2 · Frecuencia', value: result.f2, tip: 'Porcentaje de pruebas individuales que incumplen.' },
    { key: 'F3', label: 'F3 · Amplitud', value: result.f3, tip: 'Magnitud de los excesos sobre la guía.' },
  ]
  return (
    <div className="fbars">
      {factors.map((f) => (
        <div key={f.key} className="fbar-row" title={f.tip}>
```

(el resto de la fila queda igual)

- [ ] **Step 6: Reescribir `src/ui/resultados/FactorBars.css`**

```css
.fbars {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.9rem;
}
.fbar-row {
  display: grid;
  grid-template-columns: 7.5rem 1fr 2.8rem;
  align-items: center;
  gap: 0.6rem;
}
.fbar-label {
  font-size: 0.8rem;
  color: var(--muted);
  font-weight: 600;
}
.fbar-track {
  background: color-mix(in srgb, var(--line) 60%, transparent);
  border-radius: 999px;
  height: 0.55rem;
  overflow: hidden;
}
.fbar-fill {
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 999px;
  height: 100%;
}
.fbar-val {
  font-size: 0.85rem;
  font-weight: 700;
  text-align: right;
}
```

- [ ] **Step 7: Reescribir `src/ui/resultados/Heatmap.css`**

(El TSX no cambia: las celdas ya llevan `band-*` y `title`. `border-collapse: separate` + `border-spacing` permite celdas redondeadas.)

```css
.hm {
  margin-top: 0.5rem;
}
.hm-scroll {
  overflow-x: auto;
}
.hm-table {
  border-collapse: separate;
  border-spacing: 2px;
}
.hm-date {
  font-size: 0.7rem;
  color: var(--muted);
  font-weight: 500;
  padding: 0 2px;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
}
.hm-param {
  text-align: right;
  font-size: 0.8rem;
  color: var(--text);
  font-weight: 600;
  padding-right: 0.5rem;
  white-space: nowrap;
}
.hm-cell {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
.band-pass { background: var(--cat-buena); }
.band-lt10 { background: color-mix(in srgb, var(--muted) 55%, transparent); }
.band-x10to25 { background: var(--cat-regular); }
.band-gt25 { background: var(--cat-mala); }
.band-na { background: color-mix(in srgb, var(--line) 35%, transparent); }
.hm-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.6rem;
  font-size: 0.82rem;
  color: var(--muted);
}
.hm-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.hm-legend i {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 4px;
  display: inline-block;
}
.hm-station {
  margin-bottom: 1rem;
}
.hm-station-name {
  font-weight: 600;
  color: var(--muted);
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}
```

- [ ] **Step 8: `TrendChart.tsx` — series por clase**

Eliminar la constante `COLORS` y cambiar el render de series y leyenda:

```tsx
        {stations.map((st, i) => {
          const stPts = data.filter((d) => d.station === st).sort((a, b) => a.year - b.year)
          const pts = stPts.map((d) => `${x(d.year)},${y(d.wqi)}`).join(' ')
          return (
            <g key={st} className={`series-${(i % 6) + 1}`}>
              <polyline points={pts} fill="none" strokeWidth="2" />
              {stPts.map((d) => <circle key={d.year} cx={x(d.year)} cy={y(d.wqi)} r="3" />)}
            </g>
          )
        })}
```

```tsx
      <div className="trend-legend">
        {stations.map((st, i) => (
          <span key={st} className={`trend-leg series-${(i % 6) + 1}`}><i />{st}</span>
        ))}
      </div>
```

- [ ] **Step 9: Reescribir `src/ui/resultados/TrendChart.css`**

(Las `.series-*` van al final para que ganen sobre `.trend-leg` por orden de cascada.)

```css
.trend {
  margin-top: 0.5rem;
}
.trend polyline {
  stroke: currentColor;
}
.trend circle {
  fill: currentColor;
}
.trend-tick {
  fill: var(--muted);
  font-size: 0.7rem;
}
.trend-empty {
  color: var(--muted);
}
.trend-legend {
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
  margin-top: 0.4rem;
}
.trend-leg {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--muted);
}
.trend-leg i {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 3px;
  display: inline-block;
  background: currentColor;
}
.series-1 { color: var(--series-1); }
.series-2 { color: var(--series-2); }
.series-3 { color: var(--series-3); }
.series-4 { color: var(--series-4); }
.series-5 { color: var(--series-5); }
.series-6 { color: var(--series-6); }
```

- [ ] **Step 10: `ResultadosModule.tsx` + `ResultadosModule.css`**

En `ResultadosModule.tsx`, reemplazar `className="res-btn"` por `className="btn btn-primary"`.

Reescribir `ResultadosModule.css`:

```css
.res-empty {
  color: var(--muted);
  padding: 1.5rem 0;
}
.res-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.res-bar h2 {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0;
}
.res-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
.res-station {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
  padding: 1.1rem 1.2rem 1.2rem;
}
.res-chart {
  margin-top: 1.75rem;
}
.res-chart h3 {
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}
@media (max-width: 720px) {
  .res-station {
    padding: 0.9rem;
  }
}
```

Nota: la regla `.res-station .gcard { ... }` del CSS viejo desaparece porque `.gcard` ya no es tarjeta propia (la tarjeta es `.res-station`).

- [ ] **Step 11: Verificar tests, lint y build**

Run: `npm run test && npm run lint && npm run build`
Expected: todo en verde.

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "feat(diseño): módulo Resultados con gauge en degradado por categoría, series con tokens y heatmap redondeado"
```

---

### Task 7: Módulo Ayuda

**Files:**
- Modify: `src/ui/ayuda/AyudaModule.tsx` (clases de botones)
- Modify: `src/ui/ayuda/AyudaModule.css` (reescritura)
- Modify: `src/ui/ayuda/HelpContent.tsx` (chips de categorías + FAQ en `<details>`)
- Modify: `src/ui/ayuda/HelpContent.css` (reescritura)

**Interfaces:**
- Consume: `.btn*`, `.chip .chip-cat`, `.cat-*` de Task 1.
- Produce: nada nuevo.

- [ ] **Step 1: `AyudaModule.tsx` — clases de botones**

Reemplazar:

```tsx
        <button className="btn btn-primary" onClick={cargarEjemplo}>Cargar ejemplo</button>
```

y el enlace de descarga:

```tsx
        <a className="btn btn-secondary ayuda-download" href="/guia-ica.pdf" download="guia-ica.pdf">
          ⬇ Descargar la guía (PDF)
        </a>
```

- [ ] **Step 2: Reescribir `src/ui/ayuda/AyudaModule.css`**

```css
.ayuda-tutorial {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}
.ayuda-tutorial h2 {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
}
.ayuda-tutorial p {
  color: var(--muted);
  line-height: 1.6;
  margin: 0 0 0.9rem;
  max-width: 65ch;
}
.ayuda-ok {
  color: var(--ok);
  font-weight: 600;
  margin-top: 0.9rem;
}
.ayuda-recurso {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
}
.ayuda-recurso span {
  color: var(--muted);
  line-height: 1.5;
  max-width: 46rem;
  font-size: 0.95rem;
}
.ayuda-download {
  text-decoration: none;
  white-space: nowrap;
}
```

- [ ] **Step 3: `HelpContent.tsx` — chips de categorías y FAQ en acordeones**

Reemplazar la tabla de categorías por:

```tsx
        <table className="help-cats">
          <tbody>
            <tr><td><span className="chip chip-cat cat-excelente">Excelente</span></td><td>95–100</td></tr>
            <tr><td><span className="chip chip-cat cat-buena">Buena</span></td><td>80–94</td></tr>
            <tr><td><span className="chip chip-cat cat-regular">Regular</span></td><td>65–79</td></tr>
            <tr><td><span className="chip chip-cat cat-marginal">Marginal</span></td><td>45–64</td></tr>
            <tr><td><span className="chip chip-cat cat-mala">Mala</span></td><td>0–44</td></tr>
          </tbody>
        </table>
```

Reemplazar la sección «Preguntas frecuentes» por (textos idénticos, nueva estructura):

```tsx
      <section>
        <h3>Preguntas frecuentes</h3>
        <details>
          <summary>¿Mis datos se suben a algún servidor?</summary>
          <p>No. Todo el cálculo ocurre en tu navegador; nada sale de tu equipo.</p>
        </details>
        <details>
          <summary>¿Qué hago con valores bajo el límite de detección?</summary>
          <p>Escríbelos como <code>&lt;0.01</code>; se usan como el valor del límite.</p>
        </details>
        <details>
          <summary>¿Por qué un parámetro no aparece en el cálculo?</summary>
          <p>Porque no tiene guía, o su nombre no empata con ninguna columna de datos.</p>
        </details>
      </section>
```

- [ ] **Step 4: Reescribir `src/ui/ayuda/HelpContent.css`**

```css
.help {
  max-width: 65ch;
}
.help section {
  margin-bottom: 1.6rem;
}
.help h3 {
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
}
.help p,
.help li {
  color: var(--text);
  line-height: 1.65;
}
.help ul,
.help ol {
  padding-left: 1.2rem;
}
.help li {
  margin: 0.25rem 0;
}
.help-eq {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  margin: 0.35rem 0;
  font-size: 0.92rem;
  overflow-x: auto;
}
.help-cats {
  border-collapse: collapse;
}
.help-cats td {
  border: 1px solid var(--line);
  padding: 0.35rem 0.9rem;
}
.help-cats td:last-child {
  color: var(--muted);
}
.help code {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.05rem 0.3rem;
  font-size: 0.85em;
}
.help details {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  margin: 0.5rem 0;
}
.help summary {
  cursor: pointer;
  font-weight: 600;
}
.help details p {
  color: var(--muted);
  margin: 0.5rem 0 0.2rem;
}
```

- [ ] **Step 5: Verificar tests, lint y build**

Run: `npm run test && npm run lint && npm run build`
Expected: todo en verde (`HelpContent.test.tsx` sigue pasando: `/Excelente/`, `/Mala/` y `/1\.732/` siguen presentes).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(diseño): módulo Ayuda con chips de categorías, FAQ en acordeones y ancho de lectura"
```

---

### Task 8: Pulido transversal + verificación visual

**Files:**
- Modify: `src/styles/tokens.css` (quitar `--accent2`)
- Modify: `src/ui/AppShell.css` (media query responsive)
- Create: `docs/superpowers/redesign-shots/*.png` (capturas)

**Interfaces:**
- Consume: todo lo anterior.
- Produce: diseño final verificado; opcionalmente despliegue.

- [ ] **Step 1: Eliminar el alias heredado `--accent2`**

```bash
cd /home/oscolv/ia/wqi/ica
grep -rn "accent2" src --include="*.css" --include="*.tsx" --include="*.ts"
```

Expected: solo `src/styles/tokens.css`. Entonces borrar del `:root` las dos líneas:

```css
  /* alias heredado del tema viejo; se elimina en la tarea de pulido */
  --accent2: var(--accent);
```

Si apareciera en otro archivo, migrarlo a `var(--accent)` primero.

- [ ] **Step 2: Media query responsive en `AppShell.css`**

Añadir al final de `src/ui/AppShell.css`:

```css
@media (max-width: 720px) {
  .shell {
    padding: 0.75rem 0.9rem 2.5rem;
  }
  .shell-title {
    display: none;
  }
  .shell-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
```

- [ ] **Step 3: Verificación completa**

Run: `npm run test && npm run lint && npm run build`
Expected: todo en verde.

- [ ] **Step 4: Capturas antes/después con Playwright**

```bash
cd /home/oscolv/ia/wqi/ica
mkdir -p docs/superpowers/redesign-shots
(npm run dev -- --port 5199 &> /tmp/ica-dev.log &) 
sleep 3
```

Con las herramientas MCP de Playwright (`browser_navigate` a `http://localhost:5199`, `browser_take_screenshot`):
1. Guías (estado vacío) — claro.
2. Ir a Ayuda → «Cargar ejemplo» → capturar Guías con la guía del ejemplo — claro.
3. Datos (con el ejemplo cargado) — claro.
4. Resultados (con el ejemplo cargado) — claro.
5. Activar tema oscuro con el botón ☾ y repetir: Guías, Datos, Resultados, Ayuda — oscuro.

Guardar en `docs/superpowers/redesign-shots/` con nombres `guias-claro.png`, `datos-claro.png`, `resultados-claro.png`, `ayuda-claro.png`, `guias-oscuro.png`, etc. Matar el servidor dev al terminar (`pkill -f "vite.*5199"`).

Revisar las capturas: contraste legible en ambos temas, stepper con ✓ en Guías/Datos, gauge con el color de su categoría, sin restos de la paleta vieja (azul `#1f4e79`/`#3b82f6`).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(diseño): pulido responsive, limpieza de alias y capturas del rediseño"
```

- [ ] **Step 6: Despliegue (opcional, solo si el usuario lo pide)**

```bash
cd /home/oscolv/ia/wqi/ica
npm run build
CLOUDFLARE_ACCOUNT_ID=d3c2debddb955347a2fb2650362530b1 npx wrangler pages deploy dist --project-name ica --branch main
```

---

## Self-Review

**Cobertura del spec:**
- §2.1 tokens → Task 1 (tokens.css completo, claro+oscuro, categorías, semánticos). ✓
- §2.2 tipografía (Inter autoalojada, tnum) → Task 1 (fuentes + @font-face + regla tnum). ✓
- §2.3 radios/sombras/espaciado → Task 1 (tokens) + consumo en cada módulo. ✓
- §3 temas (data-theme, localStorage, anti-flash, botón ☾/☀) → Tasks 1, 2, 3. ✓
- §4 AppShell (cabecera, stepper ✓, criterios de ✓, privacidad) → Task 3. ✓
- §5.1 Guías (tarjeta, sticky, N/A atenuados, banner, hover borrado, acciones) → Task 4. ✓
- §5.2 Datos (dropzone, compuerta CTA, preview, chips censurados) → Task 5. ✓
- §5.3 Resultados (gauge degradado + animación, F1/F2/F3 con tooltip, heatmap redondeado, tendencia con tokens) → Task 6. ✓
- §5.4 Ayuda (65ch, ecuaciones, chips, FAQ acordeones, tutorial) → Task 7. ✓
- §6 accesibilidad (focus-visible, reduced-motion, foco en borrado) → Task 1 + Tasks 4/6. Responsive → Tasks 6 y 8. Micro-interacciones → transiciones `--speed` + gauge. ✓
- §7 pruebas (tests por texto/roles, tests nuevos de tema, Playwright) → Tasks 2, 3, 4, 5, 8. ✓
- §8 archivos (styles/, index.html, public/fonts/) → Task 1. ✓
- §10 criterios de aceptación → verificados en Task 8 pasos 1–4. ✓

**Escaneo de placeholders:** sin TBD/TODO; todo paso de código lleva el código completo.

**Consistencia de tipos:** `StepId`/`StepNav`/`StepNavContext`/`useStepNav` definidos en Task 3 y consumidos igual en Task 5; `getStepStatus` retorna `{ guias, datos }` y AppShell lo usa así; `categoryClass` retorna las mismas clases `.cat-*` definidas en tokens.css; `useTheme` retorna `[Theme, () => void]` tal como lo usa AppShell. El alias `--accent2` existe desde Task 1 y se elimina en Task 8 tras grep.
