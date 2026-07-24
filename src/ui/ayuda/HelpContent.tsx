import './HelpContent.css'

export function HelpContent() {
  return (
    <div className="help">
      <section>
        <h3>¿Qué es el CCME WQI?</h3>
        <p>
          El Índice de Calidad del Agua del CCME resume muchos datos de monitoreo en un
          solo número de 0 (peor) a 100 (mejor) y una categoría. No mide concentraciones
          entre sí: compara cada medición contra su propia guía y traduce todo a una
          moneda común, la <em>distancia respecto a lo aceptable</em>. Es una herramienta
          de comunicación, no un diagnóstico: dice que el agua está mal, no por qué.
        </p>
      </section>

      <section>
        <h3>Los tres factores</h3>
        <ul>
          <li><strong>F1 · Alcance</strong>: cuántos parámetros incumplen su guía al menos una vez.</li>
          <li><strong>F2 · Frecuencia</strong>: qué proporción de las pruebas incumple.</li>
          <li><strong>F3 · Amplitud</strong>: por cuánto se pasan de la guía (magnitud de los excesos).</li>
        </ul>
        <p>
          Se combinan como un vector, de modo que un solo factor alto ya baja el índice —
          así ningún problema grave se diluye.
        </p>
      </section>

      <section>
        <h3>Las ecuaciones</h3>
        <p className="help-eq">F1 = (parámetros que fallan / parámetros totales) × 100</p>
        <p className="help-eq">F2 = (pruebas que fallan / pruebas totales) × 100</p>
        <p className="help-eq">excursión = (valor / guía) − 1 &nbsp;(o guía / valor − 1 si la guía es un mínimo)</p>
        <p className="help-eq">nse = Σ excursiones / número de pruebas</p>
        <p className="help-eq">F3 = nse / (0.01 · nse + 0.01)</p>
        <p className="help-eq">WQI = 100 − √(F1² + F2² + F3²) / 1.732</p>
      </section>

      <section>
        <h3>Categorías</h3>
        <table className="help-cats">
          <tbody>
            <tr><td>Excelente</td><td>95–100</td></tr>
            <tr><td>Buena</td><td>80–94</td></tr>
            <tr><td>Regular</td><td>65–79</td></tr>
            <tr><td>Marginal</td><td>45–64</td></tr>
            <tr><td>Mala</td><td>0–44</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>Cómo usar ICA</h3>
        <ol>
          <li><strong>① Guías</strong>: elige un preset (CCME o México) o sube el tuyo, y edítalo.</li>
          <li><strong>② Datos</strong>: sube tu monitoreo (CSV/Excel, formato ancho) y revisa la validación.</li>
          <li><strong>③ Resultados</strong>: obtén el WQI por estación, la narrativa y las gráficas; descarga el CSV.</li>
        </ol>
      </section>

      <section>
        <h3>Buenas prácticas</h3>
        <ul>
          <li>Usa entre 8 y 20 parámetros; con menos de 4 el índice no es confiable.</li>
          <li>Compara sitios o años solo con los mismos parámetros y guías.</li>
          <li>Si el fondo natural es alto (metales, fluoruro), considera guías sitio-específicas.</li>
          <li>Acompaña siempre el número con una narrativa que lo explique.</li>
        </ul>
      </section>

      <section>
        <h3>Preguntas frecuentes</h3>
        <p><strong>¿Mis datos se suben a algún servidor?</strong> No. Todo el cálculo ocurre en tu navegador; nada sale de tu equipo.</p>
        <p><strong>¿Qué hago con valores bajo el límite de detección?</strong> Escríbelos como <code>&lt;0.01</code>; se usan como el valor del límite.</p>
        <p><strong>¿Por qué un parámetro no aparece en el cálculo?</strong> Porque no tiene guía, o su nombre no empata con ninguna columna de datos.</p>
      </section>
    </div>
  )
}
