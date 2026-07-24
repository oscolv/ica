import { useRef, useState } from 'react'
import { useProject } from '../../state/ProjectContext'
import { parseDataCsv } from '../../io/parseData'
import { workbookToCsv } from '../../io/readExcel'
import './DataEntry.css'

export function DataEntry() {
  const { dispatch } = useProject()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const isExcel = /\.xlsx?$/i.test(file.name)
      const csv = isExcel ? workbookToCsv(await file.arrayBuffer()) : await file.text()
      const { rows, columns, issues } = parseDataCsv(csv)
      if (issues.some((i) => i.row === 1)) {
        throw new Error('estructura inválida: no se encontraron las columnas Station/Date')
      }
      dispatch({ type: 'loadData', rows, columns, name: file.name })
      setError(null)
    } catch {
      setError('No se pudo leer el archivo. Verifica que sea un CSV o Excel (.xlsx) válido en formato ancho.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <section className="dentry">
      <h2>Sube tus datos de monitoreo</h2>
      <p className="dentry-help">
        Formato ancho: columnas <code>Station</code>, <code>Date</code> y una columna por parámetro.
        Acepta CSV o Excel (.xlsx). Los valores bajo el límite de detección pueden escribirse como <code>&lt;0.01</code>.
      </p>
      <button className="dbtn" onClick={() => fileRef.current?.click()}>Elegir archivo</button>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} aria-label="Subir archivo de datos" />
      {error && <p className="dentry-error" role="alert">{error}</p>}
    </section>
  )
}
