import { useMemo } from 'react'
import { useProject } from '../../state/ProjectContext'
import { computeStations } from '../../engine'
import { resultsToCsv } from '../../results/resultsCsv'
import { computeYearlyWqi } from '../../results/yearly'
import { computeCells } from '../../results/cells'
import { GaugeCard } from './GaugeCard'
import { FactorBars } from './FactorBars'
import { TrendChart } from './TrendChart'
import { Heatmap } from './Heatmap'
import './ResultadosModule.css'

export function ResultadosModule() {
  const { state } = useProject()
  const results = useMemo(() => {
    if (!state.data || !state.guideline) return null
    return computeStations(state.data, state.guideline)
  }, [state.data, state.guideline])
  const yearly = useMemo(
    () => (state.data && state.guideline ? computeYearlyWqi(state.data, state.guideline) : []),
    [state.data, state.guideline],
  )
  const cells = useMemo(
    () => (state.data && state.guideline ? computeCells(state.data, state.guideline) : []),
    [state.data, state.guideline],
  )

  if (!state.guideline || !state.data) {
    return <p className="res-empty">Carga una guía (paso ①) y tus datos (paso ②) para calcular el WQI.</p>
  }
  if (!results || results.length === 0) {
    return <p className="res-empty">No se pudo calcular el WQI con la guía y los datos actuales.</p>
  }

  function download() {
    const csv = resultsToCsv(results!)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resultados-wqi.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <section className="resultados">
      <div className="res-bar">
        <h2>Resultados del WQI</h2>
        <button className="res-btn" onClick={download}>Descargar CSV</button>
      </div>
      <div className="res-grid">
        {results.map((r) => (
          <div key={r.station} className="res-station">
            <GaugeCard result={r} />
            <FactorBars result={r} />
          </div>
        ))}
      </div>
      <div className="res-chart">
        <h3>Tendencia por año</h3>
        <TrendChart data={yearly} />
      </div>
      <div className="res-chart">
        <h3>Mapa de excedencias</h3>
        <Heatmap cells={cells} />
      </div>
    </section>
  )
}
