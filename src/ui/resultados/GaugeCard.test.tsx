import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GaugeCard } from './GaugeCard'
import type { StationResult } from '../../engine/types'

const r: StationResult = {
  station: 'Station1', nParams: 20, nTests: 253, failedParams: ['ALUMINUM'], nFailedTests: 39,
  f1: 20, f2: 15.4, f3: 98.9, nse: 88, wqi: 41, category: 'Poor',
}

describe('GaugeCard', () => {
  it('muestra estación, valor, categoría y narrativa', () => {
    render(<GaugeCard result={r} />)
    expect(screen.getByText('Station1')).toBeInTheDocument()
    expect(screen.getByText('41')).toBeInTheDocument()
    expect(screen.getByText('Mala')).toBeInTheDocument()
    expect(screen.getByText(/incumplieron su guía/i)).toBeInTheDocument()
  })
})
