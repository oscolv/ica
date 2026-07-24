import { describe, it, expect } from 'vitest'
import { serializeProject, deserializeProject } from './projectSerde'
import type { ProjectState } from './projectReducer'
import type { GuidelineTable, DataRow } from '../engine/types'

const gl: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])
const state: ProjectState = {
  guideline: gl,
  guidelineName: 'CCME',
  data: [{ station: 'S1', date: new Date(2020, 0, 15), values: { TP: '0.02' } }],
  dataColumns: ['TP'],
  dataName: 'd.csv',
}

describe('projectSerde', () => {
  it('round-trip conserva guía, datos, fechas y nombres', () => {
    const back = deserializeProject(serializeProject(state))
    expect(back.guidelineName).toBe('CCME')
    expect(back.guideline!.get('TP')![0].upperLimit).toBe(0.05)
    expect(back.dataColumns).toEqual(['TP'])
    expect(back.data![0].station).toBe('S1')
    expect(back.data![0].date).toBeInstanceOf(Date)
    expect(back.data![0].date!.getFullYear()).toBe(2020)
  })
  it('serializa a JSON con schemaVersion', () => {
    const o = JSON.parse(serializeProject(state))
    expect(o.schemaVersion).toBe(1)
  })
  it('lanza con JSON inválido', () => {
    expect(() => deserializeProject('no es json')).toThrow()
  })
})
