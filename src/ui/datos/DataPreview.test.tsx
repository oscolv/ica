import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { DataPreview } from './DataPreview'
import type { DataRow } from '../../engine/types'

function Seed({ rows }: { rows: DataRow[] }) {
  const { dispatch } = useProject()
  return <button onClick={() => dispatch({ type: 'loadData', rows, columns: ['DO'], name: 'd.csv' })}>seed</button>
}

async function setup(rows: DataRow[]) {
  render(
    <ProjectProvider>
      <Seed rows={rows} />
      <DataPreview />
    </ProjectProvider>,
  )
  await userEvent.click(screen.getByText('seed'))
}

describe('DataPreview', () => {
  it('muestra las columnas y las filas de datos', async () => {
    await setup([{ station: 'S1', date: new Date(2020, 0, 1), values: { DO: '7' } }])
    expect(screen.getByText('DO')).toBeInTheDocument()
    expect(screen.getByText('S1')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })
  it('indica cuántas filas adicionales hay más allá de 8', async () => {
    const many: DataRow[] = Array.from({ length: 10 }, (_, i) => ({ station: `S${i}`, date: null, values: { DO: String(i) } }))
    await setup(many)
    expect(screen.getByText(/2 filas más/)).toBeInTheDocument()
  })
})
