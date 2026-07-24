import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { ResultadosModule } from './ResultadosModule'
import type { GuidelineTable, DataRow } from '../../engine/types'

function Seed({ table, rows, columns }: { table: GuidelineTable; rows: DataRow[]; columns: string[] }) {
  const { dispatch } = useProject()
  function go() {
    dispatch({ type: 'loadGuideline', table, name: 'g' })
    dispatch({ type: 'loadData', rows, columns, name: 'd.csv' })
  }
  return <button onClick={go}>seed</button>
}

describe('ResultadosModule', () => {
  it('pide cargar guía y datos si faltan', () => {
    render(<ProjectProvider><ResultadosModule /></ProjectProvider>)
    expect(screen.getByText(/carga una guía/i)).toBeInTheDocument()
  })
  it('calcula y muestra el WQI por estación con botón de descarga', async () => {
    const table: GuidelineTable = new Map([
      ['DO', [{ parameterId: 'DO', ruleType: 'min', lowerLimit: 5, upperLimit: null, unit: 'mg/L' }]],
      ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
    ])
    const rows: DataRow[] = [
      { station: 'S1', date: new Date(2020, 0, 1), values: { DO: '6', TP: '0.10' } },
      { station: 'S1', date: new Date(2020, 1, 1), values: { DO: '4', TP: '0.02' } },
    ]
    render(
      <ProjectProvider>
        <Seed table={table} rows={rows} columns={['DO', 'TP']} />
        <ResultadosModule />
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByText('seed'))
    expect(screen.getByText('S1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar csv/i })).toBeInTheDocument()
    // WQI ~34 para este caso conocido (ver motor); basta con que aparezca la tarjeta
    expect(screen.getByText(/Alcance/i)).toBeInTheDocument()
    expect(screen.getByText('34')).toBeInTheDocument()
  })
  it('muestra las secciones de tendencia y mapa de excedencias', async () => {
    const table: import('../../engine/types').GuidelineTable = new Map([
      ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
    ])
    const rows: import('../../engine/types').DataRow[] = [
      { station: 'S1', date: new Date(2019, 0, 1), values: { TP: '0.02' } },
      { station: 'S1', date: new Date(2020, 0, 1), values: { TP: '0.10' } },
    ]
    render(
      <ProjectProvider>
        <Seed table={table} rows={rows} columns={['TP']} />
        <ResultadosModule />
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByText('seed'))
    expect(screen.getByRole('heading', { name: /Tendencia por año/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Mapa de excedencias/i })).toBeInTheDocument()
  })
})
