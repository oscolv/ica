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
  it('abre el formulario de agregar parámetro', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /CCME/i }))
    await userEvent.click(screen.getByRole('button', { name: /agregar parámetro/i }))
    expect(screen.getByLabelText(/catálogo/i)).toBeInTheDocument()
  })
})
