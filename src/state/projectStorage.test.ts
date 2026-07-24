import { describe, it, expect, beforeEach } from 'vitest'
import { saveToStorage, loadFromStorage } from './projectStorage'
import type { ProjectState } from './projectReducer'
import type { GuidelineTable } from '../engine/types'

const gl: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])
const state: ProjectState = { guideline: gl, guidelineName: 'CCME', data: null, dataColumns: [], dataName: '' }

describe('projectStorage', () => {
  beforeEach(() => localStorage.clear())

  it('guarda y recupera el estado', () => {
    saveToStorage(state)
    const back = loadFromStorage()
    expect(back!.guidelineName).toBe('CCME')
    expect(back!.guideline!.get('TP')![0].upperLimit).toBe(0.05)
  })
  it('devuelve null si no hay nada guardado', () => {
    expect(loadFromStorage()).toBeNull()
  })
  it('devuelve null si el contenido está corrupto', () => {
    localStorage.setItem('ica.project.v1', 'basura')
    expect(loadFromStorage()).toBeNull()
  })
})
