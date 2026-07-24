import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { projectReducer, initialState, type ProjectState, type ProjectAction } from './projectReducer'

interface ProjectContextValue {
  state: ProjectState
  dispatch: React.Dispatch<ProjectAction>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState)
  return <ProjectContext.Provider value={{ state, dispatch }}>{children}</ProjectContext.Provider>
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject debe usarse dentro de <ProjectProvider>')
  return ctx
}
