import { useRef } from 'react'
import { useProject } from '../state/ProjectContext'
import { serializeProject, deserializeProject } from '../state/projectSerde'
import './ProjectMenu.css'

export function ProjectMenu() {
  const { state, dispatch } = useProject()
  const fileRef = useRef<HTMLInputElement>(null)

  function exportProject() {
    const blob = new Blob([serializeProject(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'proyecto.ica.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async function importProject(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      dispatch({ type: 'hydrate', state: deserializeProject(await file.text()) })
    } catch {
      // archivo inválido: se ignora silenciosamente
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="pm">
      <button className="pm-btn" onClick={exportProject}>Exportar</button>
      <button className="pm-btn" onClick={() => fileRef.current?.click()}>Importar</button>
      <input ref={fileRef} type="file" accept=".json,.ica.json,application/json" hidden onChange={importProject} aria-label="Importar proyecto" />
    </div>
  )
}
