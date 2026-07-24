import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { ValidationPanel } from './ValidationPanel'
import type { GuidelineTable } from '../../engine/types'

function Seed({ table }: { table: GuidelineTable }) {
  const { dispatch } = useProject()
  return <button onClick={() => dispatch({ type: 'loadGuideline', table, name: 'x' })}>seed</button>
}

async function setup(table: GuidelineTable) {
  render(
    <ProjectProvider>
      <Seed table={table} />
      <ValidationPanel />
    </ProjectProvider>,
  )
  await userEvent.click(screen.getByText('seed'))
}

describe('ValidationPanel', () => {
  it('muestra un error cuando una regla max no tiene límite', async () => {
    const t: GuidelineTable = new Map([['AS', [{ parameterId: 'AS', ruleType: 'max', lowerLimit: null, upperLimit: null, unit: 'ug/L' }]]])
    await setup(t)
    expect(screen.getByText(/límite superior/i)).toBeInTheDocument()
  })
  it('muestra que la guía es válida cuando no hay issues', async () => {
    const t: GuidelineTable = new Map([['AS', [{ parameterId: 'AS', ruleType: 'max', lowerLimit: null, upperLimit: 5, unit: 'ug/L' }]]])
    await setup(t)
    expect(screen.getByText(/válida/i)).toBeInTheDocument()
  })
})
