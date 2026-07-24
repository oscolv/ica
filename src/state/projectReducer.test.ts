import { describe, it, expect } from 'vitest'
import { projectReducer, initialState } from './projectReducer'
import type { GuidelineTable, GuidelineRow } from '../engine/types'

function table(rows: GuidelineRow[]): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const r of rows) {
    const a = m.get(r.parameterId) ?? []
    a.push(r); m.set(r.parameterId, a)
  }
  return m
}
const row = (o: Partial<GuidelineRow>): GuidelineRow => ({
  parameterId: 'X', ruleType: 'max', lowerLimit: null, upperLimit: null, ...o,
})

describe('projectReducer', () => {
  it('loadGuideline reemplaza la guía y el nombre', () => {
    const t = table([row({ parameterId: 'AS', upperLimit: 5 })])
    const s = projectReducer(initialState, { type: 'loadGuideline', table: t, name: 'CCME' })
    expect(s.guidelineName).toBe('CCME')
    expect(s.guideline!.get('AS')![0].upperLimit).toBe(5)
  })
  it('setRow modifica una fila puntual sin mutar el estado previo', () => {
    const t = table([row({ parameterId: 'AS', upperLimit: 5 })])
    const s1 = projectReducer(initialState, { type: 'loadGuideline', table: t, name: 'x' })
    const s2 = projectReducer(s1, { type: 'setRow', parameterId: 'AS', index: 0, patch: { upperLimit: 10 } })
    expect(s2.guideline!.get('AS')![0].upperLimit).toBe(10)
    expect(s1.guideline!.get('AS')![0].upperLimit).toBe(5) // inmutable
  })
  it('addParameter agrega una fila nueva', () => {
    const s1 = projectReducer(initialState, { type: 'loadGuideline', table: table([]), name: 'x' })
    const s2 = projectReducer(s1, { type: 'addParameter', row: row({ parameterId: 'TP', ruleType: 'max', upperLimit: 0.05 }) })
    expect(s2.guideline!.get('TP')![0].upperLimit).toBe(0.05)
  })
  it('removeParameter elimina el parámetro', () => {
    const t = table([row({ parameterId: 'AS', upperLimit: 5 })])
    const s1 = projectReducer(initialState, { type: 'loadGuideline', table: t, name: 'x' })
    const s2 = projectReducer(s1, { type: 'removeParameter', parameterId: 'AS' })
    expect(s2.guideline!.has('AS')).toBe(false)
  })
  it('removeRow elimina solo una fila; borra el parámetro si queda vacío', () => {
    const t = table([
      row({ parameterId: 'PB', ruleType: 'hardnessStep', upperLimit: 1, hardnessLower: 0, hardnessUpper: 60 }),
      row({ parameterId: 'PB', ruleType: 'hardnessStep', upperLimit: 7, hardnessLower: 180, hardnessUpper: null }),
    ])
    const s1 = projectReducer(initialState, { type: 'loadGuideline', table: t, name: 'x' })
    const s2 = projectReducer(s1, { type: 'removeRow', parameterId: 'PB', index: 0 })
    expect(s2.guideline!.get('PB')).toHaveLength(1)
    expect(s2.guideline!.get('PB')![0].upperLimit).toBe(7)
    const s3 = projectReducer(s2, { type: 'removeRow', parameterId: 'PB', index: 0 })
    expect(s3.guideline!.has('PB')).toBe(false)
  })
  it('loadData guarda filas, columnas y nombre sin borrar la guía', () => {
    const withGl = projectReducer(initialState, { type: 'loadGuideline', table: table([row({ parameterId: 'AS', upperLimit: 5 })]), name: 'CCME' })
    const s = projectReducer(withGl, { type: 'loadData', rows: [{ station: 'S1', date: null, values: { AS: '1' } }], columns: ['AS'], name: 'datos.csv' })
    expect(s.dataName).toBe('datos.csv')
    expect(s.data!).toHaveLength(1)
    expect(s.dataColumns).toEqual(['AS'])
    expect(s.guidelineName).toBe('CCME') // la guía se conserva
  })
  it('clearData borra el dataset pero conserva la guía', () => {
    const withGl = projectReducer(initialState, { type: 'loadGuideline', table: table([row({ parameterId: 'AS', upperLimit: 5 })]), name: 'CCME' })
    const withData = projectReducer(withGl, { type: 'loadData', rows: [{ station: 'S1', date: null, values: { AS: '1' } }], columns: ['AS'], name: 'd.csv' })
    const s = projectReducer(withData, { type: 'clearData' })
    expect(s.data).toBeNull()
    expect(s.dataColumns).toEqual([])
    expect(s.guideline).not.toBeNull()
  })
  it('hydrate reemplaza el estado completo', () => {
    const t = table([row({ parameterId: 'AS', upperLimit: 5 })])
    const nuevo = { guideline: t, guidelineName: 'X', data: null, dataColumns: [], dataName: '' }
    const s = projectReducer(initialState, { type: 'hydrate', state: nuevo })
    expect(s.guidelineName).toBe('X')
    expect(s.guideline!.get('AS')![0].upperLimit).toBe(5)
  })
})
