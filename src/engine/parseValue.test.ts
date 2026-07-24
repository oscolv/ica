import { describe, it, expect } from 'vitest'
import { parseValue } from './parseValue'

describe('parseValue', () => {
  it('parsea un número normal', () => {
    expect(parseValue('12.3')).toEqual({ value: 12.3, nonDetect: false })
  })
  it('trata "<0.01" como no detectado en el valor del límite', () => {
    expect(parseValue('<0.01')).toEqual({ value: 0.01, nonDetect: true })
  })
  it('trata "L0.05" como no detectado', () => {
    expect(parseValue('L0.05')).toEqual({ value: 0.05, nonDetect: true })
  })
  it('celda vacía -> null', () => {
    expect(parseValue('')).toEqual({ value: null, nonDetect: false })
    expect(parseValue(null)).toEqual({ value: null, nonDetect: false })
    expect(parseValue(undefined)).toEqual({ value: null, nonDetect: false })
  })
  it('texto no numérico -> null', () => {
    expect(parseValue('abc')).toEqual({ value: null, nonDetect: false })
  })
  it('prefijo de no-detectado sin número -> null', () => {
    expect(parseValue('<')).toEqual({ value: null, nonDetect: false })
    expect(parseValue('L')).toEqual({ value: null, nonDetect: false })
  })
})
