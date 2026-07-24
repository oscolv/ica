import { describe, it, expect } from 'vitest'
import { categoryLabelEs, categoryColor } from './categoryInfo'

describe('categoryInfo', () => {
  it('traduce las categorías al español', () => {
    expect(categoryLabelEs('Excellent')).toBe('Excelente')
    expect(categoryLabelEs('Good')).toBe('Buena')
    expect(categoryLabelEs('Fair')).toBe('Regular')
    expect(categoryLabelEs('Marginal')).toBe('Marginal')
    expect(categoryLabelEs('Poor')).toBe('Mala')
  })
  it('asigna un color por categoría', () => {
    expect(categoryColor('Excellent')).toBe('#1E8449')
    expect(categoryColor('Poor')).toBe('#C0392B')
  })
})
