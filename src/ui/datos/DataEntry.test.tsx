import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { DataEntry } from './DataEntry'

function Probe() {
  const { state } = useProject()
  return <div data-testid="probe">{state.data ? `${state.dataName}:${state.data.length}` : 'sin-datos'}</div>
}

function setup() {
  render(
    <ProjectProvider>
      <DataEntry />
      <Probe />
    </ProjectProvider>,
  )
}

describe('DataEntry', () => {
  it('carga un CSV de datos y lo guarda en el estado', async () => {
    setup()
    const csv = 'Station,Date,DO\nS1,2020-01-01,7\nS1,2020-02-01,6\n'
    const file = new File([csv], 'datos.csv', { type: 'text/csv' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(screen.getByTestId('probe').textContent).toBe('datos.csv:2')
  })
  it('muestra un mensaje si el archivo no se puede leer', async () => {
    setup()
    const bad = new File([new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])], 'malo.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, bad)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
