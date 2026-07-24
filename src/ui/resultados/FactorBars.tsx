import type { StationResult } from '../../engine/types'
import './FactorBars.css'

export function FactorBars({ result }: { result: StationResult }) {
  const factors = [
    { key: 'F1', label: 'F1 · Alcance', value: result.f1, tip: 'Porcentaje de parámetros que incumplen su guía al menos una vez.' },
    { key: 'F2', label: 'F2 · Frecuencia', value: result.f2, tip: 'Porcentaje de pruebas individuales que incumplen.' },
    { key: 'F3', label: 'F3 · Amplitud', value: result.f3, tip: 'Magnitud de los excesos sobre la guía.' },
  ]
  return (
    <div className="fbars">
      {factors.map((f) => (
        <div key={f.key} className="fbar-row" title={f.tip}>
          <span className="fbar-label">{f.label}</span>
          <div className="fbar-track">
            <div className="fbar-fill" style={{ width: `${Math.max(0, Math.min(100, f.value))}%` }} />
          </div>
          <span className="fbar-val">{f.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}
