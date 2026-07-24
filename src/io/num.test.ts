import { describe, it, expect } from 'vitest'
import { parseNumOrNull } from './num'

describe('parseNumOrNull', () => {
  it('convierte números', () => {
    expect(parseNumOrNull('0.05')).toBe(0.05)
    expect(parseNumOrNull(' 120 ')).toBe(120)
  })
  it('vacío/null/undefined/no-numérico -> null', () => {
    expect(parseNumOrNull('')).toBeNull()
    expect(parseNumOrNull(null)).toBeNull()
    expect(parseNumOrNull(undefined)).toBeNull()
    expect(parseNumOrNull('abc')).toBeNull()
  })
})
