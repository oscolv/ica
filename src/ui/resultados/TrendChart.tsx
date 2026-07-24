import type { YearlyWqi } from '../../results/yearly'
import './TrendChart.css'

const W = 520, H = 220, PAD = 34

export function TrendChart({ data }: { data: YearlyWqi[] }) {
  const years = [...new Set(data.map((d) => d.year))].sort((a, b) => a - b)
  if (years.length < 2) {
    return <p className="trend-empty">La tendencia necesita al menos dos años de datos.</p>
  }

  const stations = [...new Set(data.map((d) => d.station))].sort()
  const minY = years[0], maxY = years[years.length - 1]
  const x = (year: number) => PAD + ((year - minY) / (maxY - minY)) * (W - 2 * PAD)
  const y = (wqi: number) => H - PAD - (wqi / 100) * (H - 2 * PAD)

  return (
    <div className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Tendencia del WQI por año">
        {/* ejes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--line)" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--line)" />
        {[0, 50, 100].map((v) => (
          <text key={v} x={PAD - 6} y={y(v) + 4} textAnchor="end" className="trend-tick">{v}</text>
        ))}
        {years.map((yr) => (
          <text key={yr} x={x(yr)} y={H - PAD + 16} textAnchor="middle" className="trend-tick">{yr}</text>
        ))}
        {stations.map((st, i) => {
          const stPts = data.filter((d) => d.station === st).sort((a, b) => a.year - b.year)
          const pts = stPts.map((d) => `${x(d.year)},${y(d.wqi)}`).join(' ')
          return (
            <g key={st} className={`series-${(i % 6) + 1}`}>
              <polyline points={pts} fill="none" strokeWidth="2" />
              {stPts.map((d) => <circle key={d.year} cx={x(d.year)} cy={y(d.wqi)} r="3" />)}
            </g>
          )
        })}
      </svg>
      <div className="trend-legend">
        {stations.map((st, i) => (
          <span key={st} className={`trend-leg series-${(i % 6) + 1}`}><i />{st}</span>
        ))}
      </div>
    </div>
  )
}
