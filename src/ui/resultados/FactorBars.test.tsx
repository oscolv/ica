import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FactorBars } from './FactorBars'
import type { StationResult } from '../../engine/types'

const r: StationResult = {
  station: 'S1', nParams: 20, nTests: 253, failedParams: [], nFailedTests: 39,
  f1: 20, f2: 15.4, f3: 98.9, nse: 88, wqi: 41, category: 'Poor',
}

describe('FactorBars', () => {
  it('muestra los tres factores con sus valores', () => {
    render(<FactorBars result={r} />)
    expect(screen.getByText(/Alcance/i)).toBeInTheDocument()
    expect(screen.getByText(/Frecuencia/i)).toBeInTheDocument()
    expect(screen.getByText(/Amplitud/i)).toBeInTheDocument()
    expect(screen.getByText('20.0')).toBeInTheDocument()
    expect(screen.getByText('98.9')).toBeInTheDocument()
  })
})
