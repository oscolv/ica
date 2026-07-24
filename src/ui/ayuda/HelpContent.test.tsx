import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelpContent } from './HelpContent'

describe('HelpContent', () => {
  it('muestra las secciones principales', () => {
    render(<HelpContent />)
    expect(screen.getByRole('heading', { name: /¿Qué es el CCME WQI\?/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Los tres factores/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Las ecuaciones/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Categorías/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Preguntas frecuentes/i })).toBeInTheDocument()
  })
  it('incluye la ecuación del WQI y las categorías', () => {
    render(<HelpContent />)
    expect(screen.getByText(/1\.732/)).toBeInTheDocument()
    expect(screen.getByText(/Excelente/)).toBeInTheDocument()
    expect(screen.getByText(/Mala/)).toBeInTheDocument()
  })
})
