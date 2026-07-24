import { useState } from 'react'
import { useProject } from '../../state/ProjectContext'
import { loadExample } from '../../examples'
import { HelpContent } from './HelpContent'
import './AyudaModule.css'

export function AyudaModule() {
  const { dispatch } = useProject()
  const [loaded, setLoaded] = useState(false)

  function cargarEjemplo() {
    const ex = loadExample()
    dispatch({ type: 'loadGuideline', table: ex.guidelineTable, name: ex.guidelineName })
    dispatch({ type: 'loadData', rows: ex.rows, columns: ex.columns, name: ex.dataName })
    setLoaded(true)
  }

  return (
    <section className="ayuda">
      <div className="ayuda-tutorial">
        <h2>Tutorial rápido</h2>
        <p>
          Carga el ejemplo del manual (río North Saskatchewan, 1997) para probar ICA en un clic.
          Luego ve al paso <strong>③ Resultados</strong>: debe dar <strong>WQI = 88</strong> (categoría «Buena»).
        </p>
        <button className="ayuda-btn" onClick={cargarEjemplo}>Cargar ejemplo</button>
        {loaded && (
          <p className="ayuda-ok" role="status">
            ✅ Ejemplo cargado. Ve al paso ③ Resultados para ver el WQI = 88.
          </p>
        )}
      </div>
      <div className="ayuda-recurso">
        <span>
          📄 <strong>Guía de referencia completa</strong> — el algoritmo y sus ecuaciones, la
          documentación de las guías y sus tipos de regla, el ejemplo validado y cómo usar el sitio.
        </span>
        <a className="ayuda-btn ayuda-download" href="/guia-ica.pdf" download="guia-ica.pdf">
          ⬇ Descargar la guía (PDF)
        </a>
      </div>
      <HelpContent />
    </section>
  )
}
