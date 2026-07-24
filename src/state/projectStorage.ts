import type { ProjectState } from './projectReducer'
import { serializeProject, deserializeProject } from './projectSerde'

const KEY = 'ica.project.v1'

export function saveToStorage(state: ProjectState): void {
  try {
    localStorage.setItem(KEY, serializeProject(state))
  } catch {
    // almacenamiento no disponible o lleno: se ignora
  }
}

export function loadFromStorage(): ProjectState | null {
  try {
    const s = localStorage.getItem(KEY)
    return s ? deserializeProject(s) : null
  } catch {
    return null
  }
}
