import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendChart } from './TrendChart'
import type { YearlyWqi } from '../../results/yearly'

describe('TrendChart', () => {
  it('avisa cuando hay menos de dos años', () => {
    const data: YearlyWqi[] = [{ station: 'S1', year: 2020, wqi: 80 }]
    render(<TrendChart data={data} />)
    expect(screen.getByText(/al menos dos años/i)).toBeInTheDocument()
  })
  it('dibuja la tendencia y lista las estaciones', () => {
    const data: YearlyWqi[] = [
      { station: 'S1', year: 2019, wqi: 90 },
      { station: 'S1', year: 2020, wqi: 40 },
    ]
    const { container } = render(<TrendChart data={data} />)
    expect(screen.getByText('S1')).toBeInTheDocument()
    expect(container.querySelector('polyline')).not.toBeNull()
    expect(screen.getByText('2019')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
  })
})
