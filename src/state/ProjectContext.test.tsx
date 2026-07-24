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
