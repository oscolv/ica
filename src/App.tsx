import './App.css'

const MODULOS = [
  {
    n: '①',
    titulo: 'Guías',
    desc: 'Parte de un preset (CCME o plantilla México) o sube el tuyo. Agrega parámetros (DBO, DQO, fluoruro, E. coli…) con un asistente que valida nombres y unidades.',
  },
  {
    n: '②',
    titulo: 'Datos',
    desc: 'Sube tu monitoreo en CSV o Excel. El sitio valida contra la guía: nombres, unidades, tipos, rangos y dependencias, con mensajes claros en español.',
  },
  {
    n: '③',
    titulo: 'Resultados',
    desc: 'Calcula el WQI por estación, con gauge y categoría, narrativa automática, tendencia temporal, descomposición F1/F2/F3 y mapa de excedencias. Exporta a PDF/PNG/CSV.',
  },
  {
    n: '④',
    titulo: 'Ayuda',
    desc: 'Tutorial guiado con dataset de ejemplo, explicación del índice y sus ecuaciones, catálogo de parámetros y buenas prácticas.',
  },
]

function App() {
  return (
    <main className="wrap">
      <header className="hero">
        <div className="brand">ICA</div>
        <h1>Índice de Calidad del Agua</h1>
        <p className="lead">
          Calcula el <strong>CCME Water Quality Index</strong> directamente en tu
          navegador. Tus datos nunca salen de tu equipo.
        </p>
        <span className="badge">En construcción · v0</span>
      </header>

      <section className="grid">
        {MODULOS.map((m) => (
          <article key={m.titulo} className="card">
            <div className="card-n">{m.n}</div>
            <h2>{m.titulo}</h2>
            <p>{m.desc}</p>
          </article>
        ))}
      </section>

      <footer className="foot">
        <p>
          Motor de cálculo validado contra el programa oficial CCME WQI y el
          ejemplo del manual (WQI = 88).
        </p>
        <p className="muted">ica.endho.mx</p>
      </footer>
    </main>
  )
}

export default App
