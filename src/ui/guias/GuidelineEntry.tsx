import { useRef, useState } from 'react'
import { useProject } from '../../state/ProjectContext'
import { PRESETS } from '../../presets'
import { parseGuidelinesCsv } from '../../io/parseGuidelines'
import { workbookToCsv } from '../../io/readExcel'
import './GuidelineEntry.css'

export function GuidelineEntry() {
  const { dispatch } = useProject()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const isExcel = /\.xlsx?$/i.test(file.name)
      const csv = isExcel ? workbookToCsv(await file.arrayBuffer()) : await file.text()
      const { table } = parseGuidelinesCsv(csv)
      dispatch({ type: 'loadGuideline', table, name: file.name })
      setError(null)
    } catch {
      setError('No se pudo leer el archivo. Verifica que sea un CSV o Excel (.xlsx) válido.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <section className="entry">
      <h2>Elige un punto de partida</h2>
      <div className="entry-grid">
        {PRESETS.map((p) => (
          <button key={p.id} className="entry-card" onClick={() => dispatch({ type: 'loadGuideline', table: p.table, name: p.name })}>
            <strong>{p.name}</strong>
            <span>{p.description}</span>
          </button>
        ))}
        <button className="entry-card" onClick={() => fileRef.current?.click()}>
          <strong>Subir mi archivo</strong>
          <span>Importa un Guidelines en CSV o Excel (.xlsx).</span>
        </button>
        <button className="entry-card" onClick={() => dispatch({ type: 'loadGuideline', table: new Map(), name: 'Nueva guía' })}>
          <strong>Empezar de cero</strong>
          <span>Crea una guía vacía y agrega parámetros.</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} />
      {error && <p className="entry-error" role="alert">{error}</p>}
    </section>
  )
}
