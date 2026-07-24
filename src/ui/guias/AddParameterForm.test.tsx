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
