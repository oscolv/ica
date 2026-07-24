import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { ProjectProvider } from '../state/ProjectContext'

describe('AppShell', () => {
  it('muestra el paso Guías por defecto y permite cambiar de pestaña', async () => {
    render(
      <ProjectProvider>
        <AppShell steps={{ guias: <p>contenido guias</p>, datos: <p>contenido datos</p> }} />,
      </ProjectProvider>,
    )
    expect(screen.getByText('contenido guias')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /datos/i }))
    expect(screen.getByText('contenido datos')).toBeInTheDocument()
  })
  it('muestra marcador "próximamente" para pasos sin contenido', () => {
    render(
      <ProjectProvider>
        <AppShell />
      </ProjectProvider>,
    )
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument()
  })
  it('muestra la nota de privacidad', () => {
    render(
      <ProjectProvider>
        <AppShell />
      </ProjectProvider>,
    )
    expect(screen.getByText(/solo en tu navegador/i)).toBeInTheDocument()
  })
})
