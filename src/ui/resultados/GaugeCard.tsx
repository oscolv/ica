import { useEffect, useId, useState } from 'react'
import type { StationResult } from '../../engine/types'
import { categoryLabelEs, categoryClass } from '../../results/categoryInfo'
import { buildNarrative } from '../../results/narrative'
import './GaugeCard.css'

// Medidor semicircular: arco de (20,100) a (180,100), radio 80.
const ARC = 'M 20 100 A 80 80 0 0 1 180 100'
const CIRC = Math.PI * 80 // longitud del semicírculo

export function GaugeCard({ result }: { result: StationResult }) {
  const gid = useId()
  const pct = Math.max(0, Math.min(100, result.wqi))
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(t)
  }, [])
  const offset = CIRC * (1 - (shown ? pct : 0) / 100)

  return (
    <article className={`gcard ${categoryClass(result.category)}`}>
      <h3 className="gcard-station">{result.station}</h3>
      <div className="gcard-gauge">
        <svg viewBox="0 0 200 120" width="200" height="120" role="img" aria-label={`WQI ${result.wqi.toFixed(0)}, ${categoryLabelEs(result.category)}`}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="gstop-a" />
              <stop offset="1" className="gstop-b" />
            </linearGradient>
          </defs>
          <path d={ARC} fill="none" className="garc-track" strokeWidth="14" strokeLinecap="round" />
          <path
            d={ARC}
            fill="none"
            stroke={`url(#${gid})`}
            className="garc-prog"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
          <text x="100" y="94" textAnchor="middle" className="gcard-value">{result.wqi.toFixed(0)}</text>
        </svg>
      </div>
      <div className="gcard-cat chip chip-cat">{categoryLabelEs(result.category)}</div>
      <p className="gcard-narrative">{buildNarrative(result)}</p>
    </article>
  )
}
