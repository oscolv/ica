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
  it('muestra un mensaje si el archivo no se puede leer', async () => {
    setup()
    const oleHeader = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
    const bad = new File([new Uint8Array([...oleHeader, ...new Array(92).fill(0)])], 'malo.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, bad)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
