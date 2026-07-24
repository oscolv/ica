import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('muestra el paso Guías por defecto y permite cambiar de pestaña', async () => {
    render(
      <AppShell steps={{ guias: <p>contenido guias</p>, datos: <p>contenido datos</p> }} />,
    )
    expect(screen.getByText('contenido guias')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /datos/i }))
    expect(screen.getByText('contenido datos')).toBeInTheDocument()
  })
  it('muestra marcador "próximamente" para pasos sin contenido', () => {
    render(<AppShell />)
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument()
  })
})
