# Rediseño visual «Agua viva» — Especificación de diseño

**Fecha:** 2026-07-24 · **Estado:** aprobado por el usuario (brainstorming) · **Alcance:** presentación solamente — no cambia ninguna lógica de negocio.

## 1. Contexto y objetivos

ICA (ica.endho.mx) calcula el CCME Water Quality Index en el navegador. La app funciona y está validada, pero su presentación actual es «diseño de desarrollador»: fuente del sistema, tablas planas, sin identidad visual, sin jerarquía tipográfica.

El rediseño debe lograr, en orden de importancia declarada por el usuario (todos seleccionados):

1. **Imagen profesional/institucional** — que SEMARNAT vea una herramienta seria y cuidada.
2. **Claridad y usabilidad** — el flujo Guías → Datos → Resultados debe entenderse de un vistazo.
3. **Resultados más impactantes** — gauge, mapa de calor y factores con presentación digna de informe.
4. **Modernización general** — espaciado, micro-interacciones, dos temas bien hechos.

**Decisiones tomadas en el brainstorming:**

- Identidad visual **libre** (sin ataduras a SEMARNAT/UAM), dirección elegida: **«Agua viva»** — clara, turquesas, pastillas redondeadas, tarjetas flotantes con sombra suave.
- Stack: **tokens propios + CSS moderno**, sin frameworks UI ni librerías de componentes. Cero dependencias de runtime nuevas.
- **Tema claro por defecto + tema oscuro con botón** (persistido en localStorage).
- Enfoque: **reskin completo + mejoras estructurales selectivas** (cabecera, gauge, estados vacíos, dropzone). Los límites de los componentes se respetan; no se repiensan flujos ni navegación.

## 2. Sistema de diseño

### 2.1 Tokens (variables CSS)

Todos los valores visuales viven en `:root` (tema claro) y `:root[data-theme="dark"]`. Los componentes solo consumen tokens, nunca valores literales.

**Tema claro (por defecto):**

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#eef7f7 → #e9f3f9` (gradiente 160°) | fondo de página |
| `--card` | `#ffffff` | tarjetas |
| `--text` | `#0f2e3d` | tinta principal |
| `--muted` | `#5b7a89` | texto secundario |
| `--primary` | `#0e7490` | botón primario, paso activo |
| `--accent` | `#0d9488` | acentos, gauge, gradientes |
| `--line` | `#d7e5ea` | bordes |

**Tema oscuro** (`data-theme="dark"`):

| Token | Valor |
|---|---|
| `--bg` | `#0a1a23 → #0c2231` (gradiente 160°) |
| `--card` | `#10293a` |
| `--text` | `#d9edf2` |
| `--muted` | `#7fa3b3` |
| `--primary` | `#2dd4bf` |
| `--accent` | `#14b8a6` |
| `--line` | `#1f3f52` |

**Categorías del WQI** (semáforo exclusivo para calidad del agua). Viven en un namespace de tokens separado (`--cat-*`) que nunca se mezcla con los tokens de marca (`--primary`, `--accent`): los tonos pueden ser vecinos en matiz, pero ningún valor de categoría es idéntico a un token de marca, y la marca nunca comunica estado.

| Categoría | Claro (fondo/texto) | Oscuro (fondo/texto) |
|---|---|---|
| Excelente | `#0f766e` / blanco | `#5eead4` / `#06302b` |
| Buena | `#22c55e` / blanco | `#4ade80` / `#052e16` |
| Regular | `#eab308` / `#1f2937` | `#facc15` / `#422006` |
| Marginal | `#f97316` / blanco | `#fb923c` / `#431407` |
| Mala | `#dc2626` / blanco | `#f87171` / `#450a0a` |

**Semánticos de validación:** éxito verde, aviso ámbar, error rojo — fondos translúcidos (`rgba` al 10–16%) con texto saturado legible en ambos temas.

### 2.2 Tipografía

- **Una sola familia: Inter** (400/500/600/700/800), **autoalojada** en `public/fonts/` como `.woff2` con `@font-face` y `font-display: swap`. Fallback `system-ui, sans-serif`. **Cero peticiones a CDNs externos** — la promesa de privacidad («nada sale de tu navegador») se mantiene literal.
- **Números tabulares** (`font-feature-settings: 'tnum'`) en tablas, gauge, factores y todo dato numérico, para que las columnas no «bailen».
- Escala: display/h1 1.5rem·800, título de tarjeta 1.05rem·700, cuerpo 0.8–0.95rem·400, etiqueta/small 0.68–0.75rem, label mayúsculas con tracking.

### 2.3 Forma y elevación

- **Radios:** 10px controles, 12–16px tarjetas, 999px pastillas/chips.
- **Sombras:** suaves y bajas (`0 8px 24px rgba(15,46,61,.07)` en claro; equivalente atenuada en oscuro), solo en tarjetas «flotantes» y menús.
- **Espaciado:** escala de 4px (4/8/12/16/24/32) en todo.

## 3. Temas claro/oscuro

- Atributo `data-theme` en `<html>`; valores `"light"` | `"dark"`.
- La preferencia se persiste en `localStorage` (clave propia, p. ej. `ica-theme`).
- **Anti-flash:** script inline mínimo en `index.html` que lee la preferencia y fija `data-theme` antes del primer pintado.
- **Sin `prefers-color-scheme` automático:** la elección del usuario manda; si no hay preferencia guardada, claro. (Esto reemplaza el `@media (prefers-color-scheme: light)` actual en `App.css`.)
- Botón ☾/☀ en la cabecera (`AppShell`), con `aria-label` y estado accesible.

## 4. Estructura — AppShell

- **Cabecera:** marca ICA (pastilla con gradiente teal, radio 8px), título «Índice de Calidad del Agua»; a la derecha: Importar / Exportar (botones secundarios con icono ↑/↓) y el botón de tema.
- **Stepper de progreso** (reemplaza las pestañas actuales visualmente; sigue siendo `role="tablist"` con `aria-selected`): pastillas ①②③ⓘ unidas por guiones; el paso **activo** va en primario sólido con sombra; los pasos **completos** muestran ✓ verde; los pendientes, pastilla neutra. Criterios de ✓: ① Guías = la guía pasa la validación sin errores; ② Datos = la compuerta «listo para calcular» está en verde; ③ Resultados y ⓘ Ayuda nunca muestran ✓ (③ se considera «destino», no un paso completable).
- El mensaje de privacidad del pie se mantiene.

## 5. Módulos

### 5.1 Guías

- Tabla dentro de tarjeta flotante con cabecera fija al hacer scroll (`position: sticky`).
- Límites que no aplican al tipo de regla: atenuados, borde punteado, no editables.
- Banner de validación a ancho completo con resumen (✓ válida / ⚠ avisos / ✕ errores).
- Hover de fila; botón de borrado sutil que aparece al hover (visible siempre con foco de teclado).
- Acciones: `+ Agregar parámetro` primario, `Descargar CSV` secundario, `Cambiar guía` ghost.

### 5.2 Datos

- Zona de carga tipo **dropzone** (borde punteado redondeado, arrastrar/soltar + clic).
- Compuerta «Listo para calcular el WQI» como banner con flecha/cta hacia el paso ③.
- Vista previa en tarjeta con cabecera fija; valores censurados (`L0.05`) como chips.
- **Estado vacío** con ilustración simple y llamada a la acción (cargar archivo o usar el ejemplo).

### 5.3 Resultados

- **Tarjeta héroe:** gauge grande con arco en degradado (acento→verde), número tabular grande, chip de categoría en su color semáforo, narrativa debajo.
- Barras F1/F2/F3 con valores tabulares y tooltip explicativo de cada factor.
- Mapa de excedencias: celdas redondeadas, leyenda clara, tooltip por celda (fecha × parámetro × magnitud).
- Tendencia por año: gráfica con los tokens nuevos; mensaje de «datos insuficientes» con el mismo trato de estado vacío.
- `Descargar CSV` destacado; estado vacío («primero carga datos») cuando no hay nada que mostrar.

### 5.4 Ayuda

- Prosa con ancho de lectura (~65ch) e interlineado cómodo.
- Ecuaciones como tarjetas de código; tabla de categorías con chips de color.
- FAQ en acordeones (`<details>` estilados); tarjeta de tutorial con botón primario.

## 6. Transversal

**Accesibilidad**

- Anillo de foco `:focus-visible` visible en todos los controles (color primario, offset 2px).
- Contraste AA mínimo verificado en la paleta (los chips de categoría ya llevan el texto blanco u oscuro según corresponda).
- `prefers-reduced-motion: reduce` desactiva transiciones y la animación del gauge.
- El color nunca es el único canal de información (chip + texto siempre).

**Responsive**

- Escritorio primero. El stepper colapsa a pastillas con scroll horizontal; las tablas obtienen scroll propio con cabecera fija; las tarjetas de Resultados pasan de 2 columnas a 1 bajo ~720px.
- Objetivo: usable en tablet; no se pretende editar tablas grandes en móvil.

**Micro-interacciones**

- Transiciones de 120–180ms (`ease-out`) en hover, foco y cambio de tema.
- El gauge anima su arco al aparecer (salvo `reduced-motion`).

## 7. Estrategia de pruebas

- Las pruebas existentes consultan por texto/roles, no por clases CSS: el reskin no debería romperlas. Se actualizan solo donde cambie el marcado: `AppShell` (stepper, botón de tema), estados vacíos, dropzone de Datos.
- **Pruebas nuevas mínimas:** el toggle de tema cambia `data-theme` y persiste en `localStorage`; el script anti-flash aplica la preferencia guardada.
- Validación visual por módulo con Playwright (capturas antes/después contra el sitio de referencia).
- `npm run test`, `npm run lint` y `npm run build` en verde antes de desplegar.

## 8. Arquitectura de archivos

- `src/styles/tokens.css` — todos los tokens (claro, oscuro, categorías, semánticos).
- `src/styles/base.css` — reset mínimo, `body`, tipografía base, foco, reduced-motion.
- `src/App.css` actual se disuelve en los dos anteriores; los CSS por componente (`src/ui/**/*.css`) se reescriben consumiendo tokens (misma organización de archivos, un CSS por componente).
- `index.html` — script anti-flash + `<link>` a las fuentes autoalojadas.
- `public/fonts/` — `inter-*.woff2` (subconjuntos latin + latin-ext).

## 9. Fuera de alcance (YAGNI)

- i18n, PWA/offline completo, impresión o PDF de resultados.
- Cualquier cambio en el motor (`engine/`), formatos de archivo, parsers o lógica de validación.
- Rediseño de flujos (wizard, navegación lateral) — enfoque 3 descartado en el brainstorming.

## 10. Criterios de aceptación

1. Los 4 módulos renderizan con el nuevo sistema en claro y oscuro, sin valores literales fuera de `tokens.css`.
2. El botón de tema alterna y persiste; no hay flash de tema al recargar.
3. El stepper muestra ✓ en guías válidas y datos listos, y el paso activo destacado.
4. Gauge, barras F1/F2/F3, heatmap y tendencia usan tokens de categoría; el gauge anima salvo `reduced-motion`.
5. Foco visible en todos los controles; contraste AA en chips y banners.
6. Suite de pruebas, lint y build en verde; capturas antes/después archivadas.
