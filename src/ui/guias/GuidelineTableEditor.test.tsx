import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../../state/ProjectContext'
import { GuidelineTableEditor } from './GuidelineTableEditor'
import type { GuidelineTable } from '../../engine/types'

function Seed() {
  const { dispatch } = useProject()
  function load() {
    const t: GuidelineTable = new Map([
      ['ARSENIC', [{ parameterId: 'ARSENIC', ruleType: 'max', lowerLimit: null, upperLimit: 5, unit: 'ug/L' }]],
    ])
    dispatch({ type: 'loadGuideline', table: t, name: 'x' })
  }
  return <button onClick={load}>seed</button>
}

async function setup() {
  render(
    <ProjectProvider>
      <Seed />
      <GuidelineTableEditor />
    </ProjectProvider>,
  )
  await userEvent.click(screen.getByText('seed'))
}

describe('GuidelineTableEditor', () => {
  it('muestra las filas de la guía activa', async () => {
    await setup()
    expect(screen.getByDisplayValue('ARSENIC')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })
  it('edita el límite superior', async () => {
    await setup()
    const input = screen.getByDisplayValue('5')
    await userEvent.clear(input)
    await userEvent.type(input, '10')
    expect((input as HTMLInputElement).value).toBe('10')
  })
  it('elimina un parámetro', async () => {
    await setup()
    await userEvent.click(screen.getByRole('button', { name: /eliminar/i }))
    expect(screen.queryByDisplayValue('ARSENIC')).not.toBeInTheDocument()
  })
  it('permite teclear valores decimales en el límite', async () => {
    await setup()
    const input = screen.getByDisplayValue('5')
    await userEvent.clear(input)
    await userEvent.type(input, '0.05')
    expect((input as HTMLInputElement).value).toBe('0.05')
  })
})
