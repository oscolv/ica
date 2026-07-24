import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { AyudaModule } from './AyudaModule'

function Probe() {
  const { state } = useProject()
  return <div data-testid="probe">{state.guideline ? state.guideline.size : 0}:{state.data ? state.data.length : 0}</div>
}

function setup() {
  render(
    <ProjectProvider>
      <AyudaModule />
      <Probe />
    </ProjectProvider>,
  )
}

describe('AyudaModule', () => {
  it('muestra el tutorial y el contenido de ayuda', () => {
    setup()
    expect(screen.getByRole('button', { name: /cargar ejemplo/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /¿Qué es el CCME WQI\?/i })).toBeInTheDocument()
  })
  it('al cargar el ejemplo llena guía y datos en el estado', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /cargar ejemplo/i }))
    expect(screen.getByTestId('probe').textContent).toBe('10:12')
    expect(screen.getByText(/ejemplo cargado/i)).toBeInTheDocument()
  })

  it('ofrece un botón para descargar la guía en PDF', () => {
    setup()
    const link = screen.getByRole('link', { name: /descargar la guía/i })
    expect(link).toHaveAttribute('href', '/guia-ica.pdf')
    expect(link).toHaveAttribute('download')
  })

})
