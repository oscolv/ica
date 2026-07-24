import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectProvider, useProject } from '../state/ProjectContext'
import { serializeProject } from '../state/projectSerde'
import { ProjectMenu } from './ProjectMenu'
import type { GuidelineTable } from '../engine/types'

function Probe() {
  const { state } = useProject()
  return <span data-testid="name">{state.guidelineName || '—'}</span>
}

describe('ProjectMenu', () => {
  beforeEach(() => localStorage.clear())

  it('muestra los botones de exportar e importar', () => {
    render(<ProjectProvider><ProjectMenu /><Probe /></ProjectProvider>)
    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /importar/i })).toBeInTheDocument()
  })
  it('importa un proyecto .ica.json y lo carga en el estado', async () => {
    const gl: GuidelineTable = new Map([['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 }]]])
    const json = serializeProject({ guideline: gl, guidelineName: 'Importado', data: null, dataColumns: [], dataName: '' })
    render(<ProjectProvider><ProjectMenu /><Probe /></ProjectProvider>)
    const file = new File([json], 'proyecto.ica.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(screen.getByTestId('name').textContent).toBe('Importado')
  })
})
