import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { DataValidationPanel } from './DataValidationPanel'
import type { GuidelineTable, DataRow } from '../../engine/types'

function Seed({ table, rows, columns }: { table?: GuidelineTable; rows: DataRow[]; columns: string[] }) {
  const { dispatch } = useProject()
  function go() {
    if (table) dispatch({ type: 'loadGuideline', table, name: 'g' })
    dispatch({ type: 'loadData', rows, columns, name: 'd.csv' })
  }
  return <button onClick={go}>seed</button>
}

async function setup(props: { table?: GuidelineTable; rows: DataRow[]; columns: string[] }) {
  render(
    <ProjectProvider>
      <Seed {...props} />
      <DataValidationPanel />
    </ProjectProvider>,
  )
  await userEvent.click(screen.getByText('seed'))
}

describe('DataValidationPanel', () => {
  it('pide cargar una guía si hay datos pero no guía', async () => {
    await setup({ rows: [{ station: 'S1', date: null, values: { DO: '7' } }], columns: ['DO'] })
    expect(screen.getByText(/carga una guía/i)).toBeInTheDocument()
  })
  it('muestra "listo para calcular" cuando no hay errores', async () => {
    const t: GuidelineTable = new Map([['DO', [{ parameterId: 'DO', ruleType: 'min', lowerLimit: 5, upperLimit: null, unit: 'mg/L' }]]])
    await setup({ table: t, rows: [{ station: 'S1', date: null, values: { DO: '7' } }], columns: ['DO'] })
    expect(screen.getByText(/listo para calcular/i)).toBeInTheDocument()
  })
  it('bloquea cuando una regla por dureza no tiene columna de dureza', async () => {
    const t: GuidelineTable = new Map([['CU', [{ parameterId: 'CU', ruleType: 'cuHardness', lowerLimit: null, upperLimit: null, unit: 'ug/L' }]]])
    await setup({ table: t, rows: [{ station: 'S1', date: null, values: { CU: '5' } }], columns: ['CU'] })
    expect(screen.getByText(/corrige los errores/i)).toBeInTheDocument()
  })
})
