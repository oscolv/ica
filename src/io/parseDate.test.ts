import { describe, it, expect } from 'vitest'
import { parseFlexibleDate } from './parseDate'

describe('parseFlexibleDate', () => {
  it('M/D/YYYY', () => {
    const d = parseFlexibleDate('5/6/2007')!
    expect(d.getFullYear()).toBe(2007)
    expect(d.getMonth()).toBe(4) // mayo
    expect(d.getDate()).toBe(6)
  })
  it('D-Mon-YY', () => {
    const d = parseFlexibleDate('7-Jan-97')!
    expect(d.getFullYear()).toBe(1997)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(7)
  })
  it('YYYY-MM-DD', () => {
    const d = parseFlexibleDate('2008-04-04')!
    expect(d.getFullYear()).toBe(2008)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(4)
  })
  it('inválida -> null', () => {
    expect(parseFlexibleDate('no-es-fecha')).toBeNull()
    expect(parseFlexibleDate('')).toBeNull()
  })
})
