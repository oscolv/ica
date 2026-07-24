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
