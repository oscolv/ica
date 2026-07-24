import { createContext, useContext } from 'react'

export type StepId = 'guias' | 'datos' | 'resultados' | 'ayuda'
export type StepNav = (step: StepId) => void

export const StepNavContext = createContext<StepNav | null>(null)

export function useStepNav(): StepNav | null {
  return useContext(StepNavContext)
}
