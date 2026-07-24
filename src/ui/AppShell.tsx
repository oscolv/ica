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
