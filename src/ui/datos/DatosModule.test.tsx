import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider } from '../../state/ProjectContext'
import { DatosModule } from './DatosModule'

function setup() {
  render(
    <ProjectProvider>
      <DatosModule />
    </ProjectProvider>,
  )
}

describe('DatosModule', () => {
  beforeEach(() => localStorage.clear())
  it('muestra la entrada cuando no hay datos', () => {
    setup()
    expect(screen.getByText(/sube tus datos/i)).toBeInTheDocument()
  })
  it('tras cargar un CSV muestra la barra con el número de filas y el botón cambiar', async () => {
    setup()
    const csv = 'Station,Date,DO\nS1,2020-01-01,7\n'
    const file = new File([csv], 'd.csv', { type: 'text/csv' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(screen.getByRole('button', { name: /cambiar datos/i })).toBeInTheDocument()
    expect(screen.getByText(/1 filas/)).toBeInTheDocument()
  })
  it('carga un CSV soltándolo en la zona de arrastre', async () => {
    setup()
    const csv = 'Station,Date,DO\nS1,2020-01-01,7\n'
    const file = new File([csv], 'd.csv', { type: 'text/csv' })
    fireEvent.drop(document.querySelector('.dentry-drop')!, {
      dataTransfer: { files: [file] },
    })
    expect(await screen.findByText(/1 filas/)).toBeInTheDocument()
  })
})
