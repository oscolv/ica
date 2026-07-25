# Rediseño de la guía PDF «guia-ica.pdf» al lenguaje «Agua viva» — Especificación de diseño

**Fecha:** 2026-07-24 · **Estado:** aprobado por el usuario (brainstorming) · **Alcance:** presentación y artefactos visuales — no cambia ningún texto del contenido técnico ni la lógica de la app.

## 1. Contexto y objetivos

La guía de referencia `guia-ica.pdf` (15 páginas A4, LaTeX) se sirve desde `ica/public/` en `ica.endho.mx/guia-ica.pdf` (botón de descarga del módulo Ayuda). Fue diseñada antes del rediseño «Agua viva» de la app (spec `2026-07-24-redisenio-agua-viva-design.md`) y sigue con la identidad vieja: paleta azul marino `#1F4E79`, Latin Modern, cajas cuadradas, capturas de la UI anterior y figuras matplotlib con paleta por defecto.

**Objetivo:** que el PDF se lea como *el mismo producto* que `ica.endho.mx` — enfoque **A) «Espejo fiel»**, elegido por el usuario: mapear los tokens «Agua viva» 1:1 a LaTeX, con la Inter real de la app, cajas redondeadas, portada con gradiente agua, chips semáforo y figuras en la nueva paleta.

**Decisiones tomadas en el brainstorming:**

- **Alcance completo:** documento (paleta/tipografía/cajas/portada) **+** 2 capturas de pantalla re-capturadas con la UI nueva **+** 3 figuras regeneradas con la nueva paleta.
- **Fondo híbrido:** portada y páginas de Parte con el tinte agua de la web; páginas de contenido en blanco con acentos teal (imprimible).
- **Cierre:** commit en el repo (fuente `.tex` sincronizada en `docs/guia/`) **+** despliegue a producción con wrangler.
- **Contenido intacto:** mismos textos, misma TOC; solo presentación y artefactos visuales.

## 2. Sistema visual (espejo de `src/styles/tokens.css`, tema claro)

### 2.1 Paleta LaTeX

| Token web | Valor | Uso en el PDF |
|---|---|---|
| `--bg` / `--bg2` | `#eef7f7` → `#e9f3f9` | gradiente (160°) de portada y páginas de Parte (tikz) |
| `--text` | `#0f2e3d` | tinta de todo el cuerpo (sustituye al negro) |
| `--muted` | `#5b7a89` | cabeceras/pies, texto secundario, cabeceras de tabla |
| `--primary` | `#0e7490` | títulos de sección, enlaces, pastilla ICA |
| `--accent` | `#0d9488` | subtítulos, filetes, detalles |
| `--line` | `#d7e5ea` | bordes de cajas, reglas de tablas, marcos de capturas |
| `--cat-excelente` | `#0f766e` / tinta `#ffffff` | chip «Excelente» |
| `--cat-buena` | `#22c55e` / tinta `#052e16` | chip «Buena» |
| `--cat-regular` | `#eab308` / tinta `#1f2937` | chip «Regular» |
| `--cat-marginal` | `#f97316` / tinta `#431407` | chip «Marginal» |
| `--cat-mala` | `#dc2626` / tinta `#ffffff` | chip «Mala» |
| `--ok` / `--warn` / `--err` | `#15803d` / `#92600a` / `#b91c1c` | banners (ver §2.3), fondos translúcidos al 10–16% |

Las tintas de chips son las del follow-up de contraste AA (commit `75f92fd`). La marca (`--primary`/`--accent`) nunca comunica categoría de calidad; el semáforo `--cat-*` es exclusivo de la tabla de categorías.

### 2.2 Tipografía — la Inter real de la app

- Se extrae `public/fonts/inter-latin-wght-normal.woff2` (variable, 100–900) de la app y se generan instancias estáticas **400/600/700/800** en TTF con `fontTools` (`varLib.instancer`). Se guardan en `docs/guia/fonts/` (licencia SIL OFL: redistribuible) para que el repo compile autocontenido.
- Compilación con **XeLaTeX + fontspec** (pdfLaTeX no tiene Inter; la conversión woff2→TTF ya está verificada como viable con fontTools 4.62 + brotli en el equipo).
- `\emph` → slant simulado (`FakeSlant`), porque la app no sirve itálicas.
- **Números tabulares** en tablas, ecuaciones y valores F1/F2/F3 (feature `tnum`), como en la web.
- Jerarquía espejo: Parte ≈ display 800; `\section` 700 en `--primary`; `\subsection` 700 en `--accent`; cabeceras de tabla en mayúsculas pequeñas con tracking en `--muted`.

### 2.3 Forma y componentes

- **Radios:** cajas y marcos de capturas con `arc` generoso (≈8pt; equivalente impreso de 10–16px); chips de categoría como pastillas completamente redondas (999px).
- **Sombras:** solo donde la web las tiene — la tarjeta de la portada y los marcos de capturas (sombra suave difuminada). Las cajas de contenido van planas.
- **Banners:** las 4 cajas actuales (`keybox`, `warnbox`, `okbox`, `sitebox`) se rediseñan como los banners de validación de la web: fondo translúcido del color semántico, texto saturado, sin marco duro.
- **Ecuaciones (`\eqbox`):** tarjeta blanca con borde `--line` y radio, como las «tarjetas de código» del módulo Ayuda.
- **Tablas:** booktabs con reglas en `--line`; tabla de categorías con chips semáforo (pastilla + tinta AA).

## 3. Estructura de páginas

- **Portada:** página completa con gradiente agua; pastilla ICA teal (como la cabecera web); título display Inter 800 en `--text`; tarjeta blanca flotante con la descripción; pie con Sitio · Código · Privacidad.
- **Páginas de Parte (I–V):** hoja suelta con fondo agua, número romano grande en `--primary`, título display y filete `--accent`.
- **Contenido:** fondo blanco; cabecera con mini-pastilla ICA + «Índice de Calidad del Agua» a la izquierda y la sección a la derecha en `--muted`; pie con `ica.endho.mx` + número de página.
- TOC y orden de secciones sin cambios.

## 4. Artefactos

### 4.1 Capturas de pantalla (2, re-capturadas)

Las actuales (`manual_assets/site_guias.png`, `site_resultados.png`) muestran la UI vieja. Se re-capturan con Playwright contra **producción** (`ica.endho.mx` — lo que el lector verá al visitar el sitio), a escala 2×:

- `site_guias.png` → vista «Elige un punto de partida» con el stepper ✓ nuevo (es lo que describe el Paso 1).
- `site_resultados.png` → tarjeta héroe con el gauge en 88 «Buena» + barras F1/F2/F3 (reproduce el ejemplo del manual citado en el texto).
- Marco tipo tarjeta web: borde `--line`, radio grande, sombra suave (sustituye al `\shot` de filete plano).
- Contexto de navegador limpio (sin localStorage previo) para estados deterministas.

### 4.2 Figuras regeneradas (3)

Las actuales son matplotlib con paleta por defecto y fuente DejaVu. Se regeneran con `docs/guia/make_figures.py` (nuevo, queda en el repo para reproducibilidad), con **los mismos datos y fórmulas** (documentados en el `.tex` y en `ccme_wqi.py`):

- `f3_curve.pdf`, `hardness_guides.pdf`, `factors.pdf` (las 3 que referencia el `.tex`; `excursion.pdf` existe en el `manual_assets/` viejo pero no se usa en el documento).
- Estilo: series en tokens (`--series-1` `#0e7490`, `--series-2` `#dc2626`, …), rejilla en `--line`, textos en `--ink`/`--muted`, Inter registrada en matplotlib, sin espinas superiores/derechas.
- Salida PDF vectorial.

## 5. Pipeline de producción

- **Fuente canónica pasa a ser el repo:** `ica/docs/guia/guia-ica.tex`. Hoy hay dos copias idénticas (`/home/oscolv/ia/wqi/guia-ica.tex` fuera de git + la del repo) — riesgo de divergencia. La copia de `wqi/` se actualiza como espejo al final (no se borra).
- **Assets al repo:** `ica/docs/guia/manual_assets/` (figuras + capturas) y `ica/docs/guia/fonts/` (TTF instanciados). El repo compila autocontenido.
- **Build:** `docs/guia/build.sh` — `xelatex` ×2 (TOC) con salida a `docs/guia/guia-ica.pdf`.
- **Publicación:** copiar a `ica/public/guia-ica.pdf` → `npm run build` lo incluye en `dist/` → deploy:
  ```
  cd /home/oscolv/ia/wqi/ica && npm run build
  CLOUDFLARE_ACCOUNT_ID=d3c2debddb955347a2fb2650362530b1 npx wrangler pages deploy dist --project-name ica --branch main
  ```
  → verificar que `ica.endho.mx/guia-ica.pdf` sirve la versión nueva.

## 6. Verificación

1. XeLaTeX compila sin errores; warnings de overfull boxes revisados.
2. **Revisión visual de las 15 páginas** renderizadas a PNG, una por una (portada, 5 páginas de Parte, TOC, contenido, tablas, chips, capturas, figuras).
3. Enlaces internos/externos y metadatos PDF correctos.
4. Peso objetivo < ~3 MB (capturas 2× comprimidas si hace falta).
5. `npm run test`, `npm run lint` y `npm run build` en verde antes de desplegar (el test de Ayuda solo verifica el `href="/guia-ica.pdf"`; nada se rompe).

**Contingencias:** captura con estado raro → recaptura con contexto limpio; figura que no reproduce el dato exacto del manual (WQI=88, nse=0.029, excursiones 0.16/1.16/1.35/0.275) → no se sustituye hasta cuadrar; PDF excede el peso objetivo → recomprimir capturas.

## 7. Arquitectura de archivos

```
ica/docs/guia/
  guia-ica.tex          ← fuente canónica (editada)
  build.sh              ← xelatex ×2  (nuevo)
  make_figures.py       ← regenera las 4 figuras  (nuevo)
  fonts/                ← Inter 400/600/700/800 TTF instanciados  (nuevo)
  manual_assets/        ← 3 figuras regeneradas + 2 capturas nuevas  (movido al repo)
ica/public/guia-ica.pdf ← artefacto publicado (regenerado)
```

## 8. Fuera de alcance (YAGNI)

- Cambios de contenido, redacción o estructura de secciones.
- Tema oscuro del PDF (el PDF se lee/imprime en claro).
- Export PDF/PNG de resultados desde la app (pendiente ya registrado en `.superpowers/sdd/progress.md`).
- Tocar la app (código, tests, estilos) salvo la copia del PDF a `public/`.

## 9. Criterios de aceptación

1. El PDF compila con XeLaTeX desde el repo, autocontenido (`build.sh`), sin errores.
2. Paleta, tipografía Inter, radios, banners y chips reflejan los tokens «Agua viva» (tabla §2.1).
3. Portada y páginas de Parte con fondo agua; contenido blanco.
4. Las 2 capturas muestran la UI nueva; las 3 figuras usan la nueva paleta y los datos exactos del manual.
5. Revisión visual de las 15 páginas superada; enlaces y metadatos correctos; peso < ~3 MB.
6. `ica.endho.mx/guia-ica.pdf` sirve la versión nueva tras el deploy; repo commiteado (spec + fuente + assets + scripts).
