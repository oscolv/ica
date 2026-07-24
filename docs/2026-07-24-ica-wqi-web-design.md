# ICA — Índice de Calidad del Agua · Diseño (spec)

**Fecha:** 2026-07-24
**Dominio destino:** ica.endho.mx
**Estado:** Diseño aprobado — pendiente de revisión del spec antes del plan de implementación.

---

## 1. Resumen

Aplicación web para calcular el **CCME Water Quality Index (WQI)** de forma
guiada, en español y orientada a aguas mexicanas. El usuario define/edita un
conjunto de **guías** (objetivos de calidad), sube sus **datos** de monitoreo,
el sitio **valida** ambos de forma cruzada, **calcula el WQI**, produce
**gráficas y una narrativa de comunicación**, y ofrece una **sección de ayuda**
con tutorial y documentación.

El motor de cálculo es una reimplementación en TypeScript del algoritmo del
programa oficial *CCME WQI Calculator* (Government of Newfoundland and Labrador),
cuyas fórmulas y tabla de despacho de reglas fueron extraídas por ingeniería
inversa del binario `CCMEWQI.exe` y validadas contra la implementación de
referencia `ccme_wqi.py` y contra el ejemplo del manual (WQI = 88).

## 2. Objetivos

- Que cualquier persona genere un **Guidelines válido** sin conocer el formato
  interno, con asistente, catálogo de parámetros y validación en vivo.
- Permitir **partir de un preset** (CCME o plantilla México) o subir el propio.
- **Validar los datos** contra la guía (nombres, unidades, tipos, rangos,
  dependencias) con mensajes accionables en español.
- **Calcular el WQI** fielmente al programa oficial y **comunicar** el resultado
  con gauge, categoría, narrativa, tendencia, descomposición y mapa de calor.
- **Ayuda integrada**: tutorial con dataset de ejemplo, explicación del índice,
  catálogo de parámetros, buenas prácticas y FAQ.
- **Privacidad total**: todo corre en el navegador; ningún dato sale del equipo.

## 3. No-objetivos (YAGNI)

- Sin backend, cuentas de usuario ni almacenamiento en la nube (fase futura
  opcional; Cloudflare/Vercel lo permitirían sin migrar).
- Sin variantes provinciales del motor (Manitoba/Alberta/BC). Solo CCME federal
  + reglas simples + parámetros mexicanos.
- Sin multi-idioma en la v1 (español únicamente; diseñar el texto para permitir
  i18n futura sin refactor mayor).
- Sin intervalos de confianza por *bootstrap* en la v1 (posible fase posterior).

## 4. Arquitectura

SPA estática (Vite build → `dist/`) desplegable en Cloudflare Pages o Vercel.
Todo el cómputo en el navegador.

**Stack:** React + Vite + TypeScript. Librerías: Papa Parse (CSV), SheetJS
(Excel), Recharts o Chart.js (gráficas), jsPDF + captura de nodo (reporte PDF),
Vitest (pruebas).

**Capas (aisladas, con interfaces claras):**

- `engine/` — motor WQI puro (sin UI): tipos de regla, resolución de guías,
  F1/F2/F3, WQI, categorías, excursiones. Sin dependencias de framework.
- `io/` — parseo CSV/Excel, presets de guías, formato de proyecto `.ica.json`,
  autoguardado en localStorage.
- `validation/` — validación de guías y de datos; mensajes en español con
  severidad (error/aviso/ok).
- `charts/` — componentes de gráficas reutilizables.
- `ui/` — componentes React por módulo (GuidelineBuilder, DataValidator,
  Results, Help) + `ProjectStore` (estado global).

**Estado global (`ProjectStore`):** guía activa + datos + mapeo de columnas +
periodo + resultados. Autoguardado en localStorage; export/import como
`.ica.json`.

**Navegación:** asistente de 4 pasos (①Guías → ②Datos → ③Resultados + ④Ayuda)
con pestañas para saltar entre pasos ya completados.

## 5. Motor WQI y modelo de reglas

### 5.1 Tipos de regla (columna `EXCEED_IF`)

Cada regla es un módulo con interfaz uniforme:
`resolverGuía(muestra) → objetivo` y `evaluar(valor, objetivo) → {falla, excursión}`.

| Código interno | Descripción | Requiere |
|---|---|---|
| `>` | máximo (falla si valor > límite) | UPPER_LIMIT |
| `<` | mínimo (falla si valor < límite) | LOWER_LIMIT |
| `<>` | rango (falla si fuera de [inf, sup]) | LOWER + UPPER |
| `Hardness` | escalones por dureza | tabla HARDNESS_LOWER/UPPER + UPPER_LIMIT |
| `Season` | límite por fecha | SEASON_START/FINISH + límite |
| `Compute` | amoníaco no ionizado | columnas pH + temp |
| `pHDependCCME` | aluminio por pH | columna pH |
| `CdHardness` | cadmio por dureza | columna dureza |
| `CuHardness` | cobre por dureza | columna dureza |
| `NiHardness` | níquel por dureza | columna dureza |
| `PbHardness` | plomo por dureza | columna dureza |
| `ZnHardness` | zinc por dureza | columna dureza |

En la UI, el tipo se elige de un desplegable en español que mapea al código
correcto (impide errores como asignar `Compute` a un metal).

### 5.2 Fórmulas (extraídas del binario oficial, verificadas)

- **Cadmio** (`CdHardness`): H<17 → 0.04; H>280 → 0.37; si no → 10^(0.83·log₁₀H − 2.46) µg/L
- **Cobre** (`CuHardness`): H<82 → 2; H>180 → 4; si no → 0.2·e^(0.8545·lnH − 1.465) µg/L
- **Níquel** (`NiHardness`): H<60 → 25; H>180 → 150; si no → e^(0.76·lnH + 1.06) µg/L
- **Plomo** (`PbHardness`): H<60 → 1; H>180 → 7; si no → e^(1.273·lnH − 4.705) µg/L
- **Zinc** (`ZnHardness`): H<90 → 7.5; si no → 7.5 + 0.75·(H − 90) µg/L
- **Aluminio** (`pHDependCCME`): pH<6.5 → 0.005; si no → 0.1 mg/L
- **Amoníaco** (`Compute`): fracción no ionizada = 1/(1 + 10^(0.09018 + 2729.92/(273.2+T) − pH))
- **Escalón/estacional**: selecciona límite por tramo de dureza / ventana de fecha.

H = dureza (mg/L como CaCO₃) de la misma muestra; T = temperatura (°C).

### 5.3 Cálculo del índice

- **F1** = (parámetros con ≥1 falla / parámetros con dato y guía) × 100
- **F2** = (pruebas fallidas / pruebas totales) × 100
- **Excursión**: máximo → valor/objetivo − 1; mínimo → objetivo/valor − 1
- **nse** = Σ excursiones / número total de pruebas
- **F3** = nse / (0.01·nse + 0.01)
- **WQI** = 100 − √(F1² + F2² + F3²) / 1.732
- **Categorías**: Excellent 95–100, Good 80–94, Fair 65–79, Marginal 45–64, Poor 0–44

### 5.4 Reglas de datos

- No detectados (`<x`, `Lx`): se usan como el valor del límite de detección.
- Si el límite de detección > guía: se usa el LD como guía.
- Celdas vacías: se excluyen del conteo de pruebas.
- Solo cuentan parámetros con dato **y** guía aplicable.
- **Agregación por estación**; selección de periodo (1 año / 3 años / todo).

## 6. Módulo ① Guías

**Entradas:** (a) partir de preset [CCME vida acuática | Plantilla México
editable], (b) subir CSV/Excel propio, (c) empezar de cero.

**Editor (tabla interactiva):** fila por parámetro con `Parámetro`, `Tipo de
regla` (desplegable en español), `Límite inf/sup`, campos de dureza/estación
según el tipo, `Unidad`, `Fuente`. El código real (`>`, `CuHardness`, …) es
interno.

**Asistente "Agregar parámetro":** wizard (nombre → unidad de lista → tipo de
regla → límite(s) → fuente) con **catálogo de parámetros comunes** (DBO, DQO,
fluoruro, E. coli, coliformes, etc.) con valores sugeridos citando fuente
(NOM-127 / CE-CCA / OMS / CCME), editables.

**Validación en vivo (español, con severidad):** nombres sin duplicados y con
aviso si no empatarán con datos; unidad de lista controlada con detección de
incoherencias (p. ej. límite mg/L con nombre µg/L); reglas por dureza/pH exigen
la columna correspondiente; rangos `inf < sup`; codificación UTF-8 limpia.

**Salida:** CSV compatible con el programa oficial (códigos reales) y parte del
`.ica.json`.

## 7. Módulo ② Datos

**Carga:** CSV/Excel **formato ancho** (`Station`, `Date`, columnas por
parámetro). Vista previa de primeras filas.

**Validación cruzada (lista con 🔴 error / 🟡 aviso / ✅ ok):**

- **Nombres:** empareja columnas ↔ parámetros; muestra emparejados, datos sin
  guía (excluidos) y guías sin datos (no usadas); **mapeo manual** para nombres
  que no empatan (p. ej. `TEMP` ↔ `TEMPERATURE_DEG_C`).
- **Tipos/valores:** texto donde se espera número, fechas inválidas, negativos
  imposibles; normaliza `<x`/`Lx`.
- **Rangos de sanidad:** valores fuera de rango físico (pH 0–14, %OD…) y
  *outliers* extremos (posible error de unidad/captura).
- **Requisitos del índice:** avisa si <8 parámetros o <4 muestras/año; verifica
  columnas requeridas por reglas (dureza/pH/temp).
- **Dependencias:** regla `CuHardness` sin columna de dureza → error accionable.

**Habilitación:** el botón "Calcular" se activa solo sin errores 🔴; los 🟡 se
pueden ignorar conscientemente. Mensajes indican qué pasa, en qué celda y cómo
corregir.

## 8. Módulo ③ Resultados

Selector de **periodo** (1/3/todos los años) y **estación**.

- **a) Tarjeta por estación:** gauge 0–100 + color de categoría + valor +
  **narrativa automática en español** (categoría, aptitud de uso, parámetros que
  fallan y por cuánto), editable/copiable.
- **b) Tendencia temporal:** línea de WQI por año/periodo por estación.
- **c) Descomposición F1/F2/F3:** barras de los tres factores.
- **d) Mapa de calor de excedencias:** parámetro × fecha con código de color
  (verde cumple, gris <10×, amarillo 10–25×, rojo >25×).
- **e) Exportación:** PDF (gauge + narrativa + gráficas), PNG por gráfica, CSV de
  resultados (WQI, F1/F2/F3, nse, excursiones por prueba).

Paleta compartida, legible en claro/oscuro.

## 9. Módulo ④ Ayuda

- **Tutorial guiado (5 min):** recorre los 4 pasos con dataset de ejemplo
  cargable con un clic (río North Saskatchewan del manual → WQI = 88, sirve de
  comprobación).
- **Explicación del índice:** qué es/qué no es, tres factores, ecuaciones
  renderizadas, categorías.
- **Catálogo de parámetros:** unidades, tipos de regla, origen de los valores
  (CCME/NOM/CE-CCA/OMS), notas de biodisponibilidad (dureza/pH).
- **Cómo construir un buen Guidelines:** buenas prácticas (mín. 8 parámetros,
  guías sitio-específicas, no comparar entre guías distintas) y errores comunes
  (`Compute` mal usado, unidades incoherentes).
- **FAQ y glosario.**

Contenido en Markdown versionado, renderizado en la app; derivado del material
de referencia ya elaborado.

## 10. Persistencia y formato de proyecto

- **Autoguardado** en `localStorage` (guía + datos + mapeo + periodo). Aviso de
  que los datos viven solo en el navegador.
- **Proyecto `.ica.json`:** export/import de todo, con `schemaVersion`.
- Sin cuentas ni servidor.

## 11. Pruebas y calidad

- **Motor (Vitest):** pruebas por tipo de regla + el caso del manual (WQI = 88)
  como regresión bloqueante; validación cruzada contra `ccme_wqi.py`.
- **IO/validación:** parseo (`<x`, faltantes, Excel) y cada mensaje de
  validación.
- **UI:** componentes clave (constructor de guías, validador).

## 12. Despliegue

- Build Vite → `dist/` → Cloudflare Pages o Vercel; dominio `ica.endho.mx`.
- Fallback SPA (`_redirects` en Cloudflare / `vercel.json` en Vercel).
- HTTPS/CDN/previews por commit automáticos.

## 13. Fases de construcción (incremental, cada una utilizable/testeable)

1. Motor WQI en TS + pruebas (núcleo correcto, sin UI).
2. IO + presets + validación (CSV/Excel, CCME + plantilla MX).
3. Módulo Guías (editor + asistente + validación en vivo).
4. Módulo Datos (validación cruzada).
5. Módulo Resultados (cálculo + 4 gráficas + narrativa + export).
6. Módulo Ayuda (tutorial + docs).
7. Persistencia + despliegue a ica.endho.mx.

## 14. Riesgos y decisiones abiertas

- **Valores de la plantilla México:** deben anclarse a norma (NOM-127 / CE-CCA /
  OMS) y citarse; confirmar la lista exacta de parámetros y valores con el
  equipo antes de la Fase 2.
- **Excel en el navegador:** SheetJS cubre `.xlsx`; validar tamaño máximo
  razonable de archivo para no bloquear el hilo (usar Web Worker si hace falta).
- **PDF fiel:** captura de nodos DOM a PDF puede variar entre navegadores;
  definir un layout de reporte simple y robusto.
- **Nombres de parámetros:** el emparejamiento exacto nombre-columna es sensible;
  el mapeo manual mitiga, pero conviene sugerir convención de nombres.
