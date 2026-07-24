import type { ProjectState } from '../state/projectReducer'
import { validateGuidelines } from '../validation/validateGuidelines'
import { validateData } from '../validation/validateData'

export interface StepStatus {
  guias: boolean
  datos: boolean
}

export function getStepStatus(state: ProjectState): StepStatus {
  const guias =
    !!state.guideline &&
    state.guideline.size > 0 &&
    !validateGuidelines(state.guideline).some((i) => i.severity === 'error')
  const datos =
    guias &&
    !!state.data &&
    !validateData(state.data, state.dataColumns, state.guideline!).issues.some(
      (i) => i.severity === 'error',
    )
  return { guias, datos }
}
