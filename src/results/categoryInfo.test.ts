import { describe, it, expect } from 'vitest'
import { categoryLabelEs, categoryClass } from './categoryInfo'

describe('categoryInfo', () => {
  it('traduce las categorías al español', () => {
    expect(categoryLabelEs('Excellent')).toBe('Excelente')
    expect(categoryLabelEs('Good')).toBe('Buena')
    expect(categoryLabelEs('Fair')).toBe('Regular')
    expect(categoryLabelEs('Marginal')).toBe('Marginal')
    expect(categoryLabelEs('Poor')).toBe('Mala')
  })
  it('asigna la clase CSS de cada categoría', () => {
    expect(categoryClass('Excellent')).toBe('cat-excelente')
    expect(categoryClass('Good')).toBe('cat-buena')
    expect(categoryClass('Fair')).toBe('cat-regular')
    expect(categoryClass('Marginal')).toBe('cat-marginal')
    expect(categoryClass('Poor')).toBe('cat-mala')
  })
})
