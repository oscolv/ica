import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { getStoredTheme, applyTheme, useTheme } from './theme'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('theme', () => {
  it('usa tema claro cuando no hay preferencia guardada', () => {
    expect(getStoredTheme()).toBe('light')
  })
  it('lee la preferencia guardada', () => {
    localStorage.setItem('ica-theme', 'dark')
    expect(getStoredTheme()).toBe('dark')
  })
  it('applyTheme fija data-theme y persiste la elección', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('ica-theme')).toBe('dark')
  })
  it('useTheme alterna el tema', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current[0]).toBe('light')
    act(() => result.current[1]())
    expect(result.current[0]).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    act(() => result.current[1]())
    expect(result.current[0]).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
