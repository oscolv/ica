import type { CellResult } from '../../results/cells'
import './Heatmap.css'

function fmtDate(d: Date | null): string {
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '—'
}

function StationGrid({ cells }: { cells: CellResult[] }) {
  const params = [...new Set(cells.map((c) => c.parameterId))].sort()
  const dates = [...new Set(cells.map((c) => fmtDate(c.date)))].sort()
  const byKey = new Map(cells.map((c) => [`${c.parameterId}|${fmtDate(c.date)}`, c]))
  return (
    <div className="hm-scroll">
      <table className="hm-table">
        <thead>
          <tr>
            <th></th>
            {dates.map((d) => <th key={d} className="hm-date">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p}>
              <th className="hm-param">{p}</th>
              {dates.map((d) => {
                const c = byKey.get(`${p}|${d}`)
                const band = c ? c.band : 'na'
                const title = c ? `${p} · ${d}: ${c.raw}${c.fail ? ` (×${c.ratio.toFixed(1)})` : ''}` : ''
                return <td key={d} className={`hm-cell band-${band}`} title={title} />
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Heatmap({ cells }: { cells: CellResult[] }) {
  if (cells.length === 0) return <p className="hm-empty">Sin datos para el mapa de excedencias.</p>

  const stations = [...new Set(cells.map((c) => c.station))].sort()

  return (
    <div className="hm">
      {stations.map((st) => (
        <div key={st} className="hm-station">
          {stations.length > 1 && <div className="hm-station-name">{st}</div>}
          <StationGrid cells={cells.filter((c) => c.station === st)} />
        </div>
      ))}
      <div className="hm-legend">
        <span><i className="band-pass" /> Cumple</span>
        <span><i className="band-lt10" /> Falla &lt;10×</span>
        <span><i className="band-x10to25" /> 10–25×</span>
        <span><i className="band-gt25" /> &gt;25×</span>
      </div>
    </div>
  )
}
