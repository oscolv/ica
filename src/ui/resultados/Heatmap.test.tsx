import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heatmap } from './Heatmap'
import type { CellResult } from '../../results/cells'

const cells: CellResult[] = [
  { station: 'S1', date: new Date(2020, 0, 1), parameterId: 'TP', raw: '0.02', fail: false, ratio: 1, band: 'pass' },
  { station: 'S1', date: new Date(2020, 1, 1), parameterId: 'TP', raw: '0.10', fail: true, ratio: 2, band: 'lt10' },
]

describe('Heatmap', () => {
  it('avisa cuando no hay celdas', () => {
    render(<Heatmap cells={[]} />)
    expect(screen.getByText(/sin datos/i)).toBeInTheDocument()
  })
  it('muestra el parámetro y una celda por fecha con su color de banda', () => {
    const { container } = render(<Heatmap cells={cells} />)
    expect(screen.getByText('TP')).toBeInTheDocument()
    expect(container.querySelectorAll('.hm-cell').length).toBe(2)
    expect(container.querySelector('.hm-cell.band-lt10')).not.toBeNull()
  })
  it('separa las cuadrículas por estación (no colisiona misma fecha+parámetro)', () => {
    const multi: CellResult[] = [
      { station: 'S1', date: new Date(2020, 0, 1), parameterId: 'TP', raw: '0.10', fail: true, ratio: 2, band: 'lt10' },
      { station: 'S2', date: new Date(2020, 0, 1), parameterId: 'TP', raw: '2.0', fail: true, ratio: 40, band: 'gt25' },
    ]
    const { container } = render(<Heatmap cells={multi} />)
    expect(screen.getByText('S1')).toBeInTheDocument()
    expect(screen.getByText('S2')).toBeInTheDocument()
    // dos cuadrículas, cada una con su celda: no se pierde ninguna
    expect(container.querySelectorAll('.hm-cell').length).toBe(2)
    expect(container.querySelector('.hm-cell.band-lt10')).not.toBeNull()
    expect(container.querySelector('.hm-cell.band-gt25')).not.toBeNull()
  })
})
