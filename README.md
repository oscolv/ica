# ICA — Índice de Calidad del Agua

Aplicación web estática para calcular el **CCME Water Quality Index (WQI)** en el
navegador, orientada a aguas mexicanas y en español.

- **Módulo ① Guías** — parte de un preset (CCME o plantilla México) o sube el
  tuyo; agrega parámetros (DBO, DQO, fluoruro, E. coli…) con validación.
- **Módulo ② Datos** — sube CSV/Excel y valida contra la guía (nombres,
  unidades, tipos, rangos, dependencias).
- **Módulo ③ Resultados** — calcula el WQI, gráficas (gauge, tendencia,
  F1/F2/F3, mapa de excedencias) y narrativa; exporta PDF/PNG/CSV.
- **Módulo ④ Ayuda** — tutorial con dataset de ejemplo, ecuaciones y buenas
  prácticas.

Todo corre en el navegador: **ningún dato sale del equipo del usuario**.

## Stack

React + Vite + TypeScript. Sitio 100% estático.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # genera dist/
npm run preview  # previsualiza el build
```

## Despliegue (Cloudflare Pages)

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Framework preset:** Vite
- El fallback de rutas SPA está en `public/_redirects` (`/*  /index.html  200`).

## Estructura

- `src/` — aplicación React.
- `docs/` — documento de diseño (spec).
- `reference/` — motor de referencia validado (`ccme_wqi.py`) y datos/guías de
  ejemplo (`Data.csv`, `Guidelines.csv`).

## Motor de cálculo

El algoritmo reproduce el del programa oficial *CCME WQI Calculator* (fórmulas
verificadas) y está validado contra el ejemplo del manual (**WQI = 88**).
Ver `docs/` para el diseño completo.
