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
