import type { StationResult } from '../../engine/types'
import { categoryLabelEs, categoryColor } from '../../results/categoryInfo'
import { buildNarrative } from '../../results/narrative'
import './GaugeCard.css'

// Medidor semicircular: arco de (20,100) a (180,100), radio 80.
const ARC = 'M 20 100 A 80 80 0 0 1 180 100'
const CIRC = Math.PI * 80 // longitud del semicírculo

export function GaugeCard({ result }: { result: StationResult }) {
  const color = categoryColor(result.category)
  const pct = Math.max(0, Math.min(100, result.wqi))
  const offset = CIRC * (1 - pct / 100)

  return (
    <article className="gcard">
      <h3 className="gcard-station">{result.station}</h3>
      <div className="gcard-gauge">
        <svg viewBox="0 0 200 120" width="200" height="120" role="img" aria-label={`WQI ${result.wqi.toFixed(0)}, ${categoryLabelEs(result.category)}`}>
          <path d={ARC} fill="none" stroke="var(--line)" strokeWidth="14" strokeLinecap="round" />
          <path d={ARC} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset} />
          <text x="100" y="94" textAnchor="middle" className="gcard-value" fill={color}>{result.wqi.toFixed(0)}</text>
        </svg>
      </div>
      <div className="gcard-cat" style={{ color }}>{categoryLabelEs(result.category)}</div>
      <p className="gcard-narrative">{buildNarrative(result)}</p>
    </article>
  )
}
