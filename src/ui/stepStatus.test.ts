import { describe, it, expect } from 'vitest'
import { getStepStatus } from './stepStatus'
import { initialState } from '../state/projectReducer'
import type { GuidelineTable, DataRow } from '../engine/types'

const okTable: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])
const badTable: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: null, unit: 'mg/L' }]],
])
// cuHardness calcula su límite desde la dureza: la guía es válida pero los
// datos sin columna de dureza producen un ERROR de validación de datos.
const cuTable: GuidelineTable = new Map([
  ['CU', [{ parameterId: 'CU', ruleType: 'cuHardness', lowerLimit: null, upperLimit: null, unit: 'ug/L' }]],
])
const rows: DataRow[] = [{ station: 'S1', date: null, values: { TP: '0.02' } }]
const columns = ['TP']

describe('getStepStatus', () => {
  it('estado inicial: nada completo', () => {
    expect(getStepStatus(initialState)).toEqual({ guias: false, datos: false })
  })
  it('guía vacía no cuenta como completa', () => {
    expect(getStepStatus({ ...initialState, guideline: new Map() }).guias).toBe(false)
  })
  it('guía válida sin datos: solo guías completo', () => {
    expect(getStepStatus({ ...initialState, guideline: okTable })).toEqual({ guias: true, datos: false })
  })
  it('guía con errores no marca nada', () => {
    const s = getStepStatus({ ...initialState, guideline: badTable, data: rows, dataColumns: columns })
    expect(s).toEqual({ guias: false, datos: false })
  })
  it('guía válida + datos sin errores: ambos completos', () => {
    const s = getStepStatus({ ...initialState, guideline: okTable, data: rows, dataColumns: columns })
    expect(s).toEqual({ guias: true, datos: true })
  })
  it('guía válida + datos con error de validación: datos incompleto', () => {
    const cuRows: DataRow[] = [{ station: 'S1', date: null, values: { CU: '5' } }]
    const s = getStepStatus({ ...initialState, guideline: cuTable, data: cuRows, dataColumns: ['CU'] })
    expect(s).toEqual({ guias: true, datos: false })
  })
})
