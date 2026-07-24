import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { AyudaModule } from './ayuda/AyudaModule'
import { ProjectProvider } from '../state/ProjectContext'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

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
  it('alterna el tema claro/oscuro y lo persiste', async () => {
    render(
      <ProjectProvider>
        <AppShell />
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /cambiar a tema oscuro/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('ica-theme')).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: /cambiar a tema claro/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('ica-theme')).toBe('light')
  })
  it('marca con ✓ las pestañas de guías y datos tras cargar el ejemplo', async () => {
    render(
      <ProjectProvider>
        <AppShell steps={{ ayuda: <AyudaModule /> }} />
      </ProjectProvider>,
    )
    await userEvent.click(screen.getByRole('tab', { name: /ayuda/i }))
    await userEvent.click(screen.getByRole('button', { name: /cargar ejemplo/i }))
    expect(screen.getByRole('tab', { name: /guías/i }).className).toContain('is-done')
    expect(screen.getByRole('tab', { name: /datos/i }).className).toContain('is-done')
  })
})
