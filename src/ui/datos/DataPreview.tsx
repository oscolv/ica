import { useProject } from '../../state/ProjectContext'
import './DataPreview.css'

const MAX_ROWS = 8

export function DataPreview() {
  const { state } = useProject()
  if (!state.data) return null
  const rows = state.data.slice(0, MAX_ROWS)
  const extra = state.data.length - rows.length

  return (
    <div className="dprev-wrap">
      <table className="dprev">
        <thead>
          <tr>
            <th>Station</th>
            <th>Date</th>
            {state.dataColumns.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.station}</td>
              <td>{r.date ? r.date.toLocaleDateString() : ''}</td>
              {state.dataColumns.map((c) => <td key={c}>{r.values[c] ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {extra > 0 && <p className="dprev-more">… y {extra} filas más.</p>}
    </div>
  )
}
