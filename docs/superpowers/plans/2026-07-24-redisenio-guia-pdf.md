# Rediseño «Agua viva» de la guía PDF — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rehacer la presentación de `guia-ica.pdf` (15 págs., LaTeX) con el lenguaje «Agua viva» de ica.endho.mx — paleta teal, Inter real, banners redondeados, chips semáforo, portada con gradiente — más 2 capturas de la UI nueva y 3 figuras regeneradas, y publicarlo en producción.

**Architecture:** Pipeline documental autocontenido en `ica/docs/guia/`: `make_fonts.py` (Inter woff2→TTF estáticos) → `make_figures.py` (3 PDFs vectoriales con la nueva paleta, auto-validados) → capturas Playwright recortadas con `crop_shot.py` → `guia-ica.tex` reescrito solo en preámbulo/portada/tabla-de-categorías (cuerpo intacto) → `build.sh` (XeLaTeX ×2) → copia a `public/` → deploy wrangler.

**Tech Stack:** XeLaTeX + fontspec + tcolorbox + tikz (TeX Live 2023) · Python 3 con fontTools 4.62 + brotli, matplotlib 3.9 + numpy 2.0, PIL 12.2 · Playwright (herramientas MCP de esta sesión) · npm (Node ≥22.12) + wrangler.

**Spec:** `docs/superpowers/specs/2026-07-24-redisenio-guia-pdf-design.md`

## Global Constraints

- **Contenido intacto:** no se cambia ningún texto del documento (excepciones: la tabla de categorías pasa a chips —misma información— y los nombres de color LaTeX referenciados en el cuerpo).
- **Paleta:** solo los valores de la tabla §2.1 de la spec (espejo de `src/styles/tokens.css`, tema claro). Prohibido inventar colores.
- **Cero dependencias de runtime nuevas** en la app; los scripts de `docs/guia/` usan solo Python stdlib + fontTools/matplotlib/PIL ya instalados.
- **Node ≥22.12** para los comandos npm (fijado en `.node-version`).
- **Los 176 tests de la app deben seguir en verde** (ninguna tarea toca `src/`).
- **PDF final < ~3 MB.**
- **Rama de trabajo:** `redisenio-guia-pdf` (ya creada, con la spec commiteada). Merge `--ff-only` a `main` al final.
- **Deploy (comando exacto, desde `ica/`):**
  ```bash
  CLOUDFLARE_ACCOUNT_ID=d3c2debddb955347a2fb2650362530b1 npx wrangler pages deploy dist --project-name ica --branch main
  ```
- Todos los commits terminan con la línea `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Estructura de archivos

```
ica/docs/guia/
  guia-ica.tex        (modificar: preámbulo, portada, tabla de categorías, colofón)
  build.sh            (crear: XeLaTeX ×2)
  make_fonts.py       (crear: woff2 variable → 4 TTF estáticos en fonts/)
  make_figures.py     (crear: 3 figuras matplotlib auto-validadas en manual_assets/)
  crop_shot.py        (crear: recorte de capturas Playwright a rectángulo CSS)
  fonts/              (crear: Inter-{Regular,SemiBold,Bold,ExtraBold}.ttf — generados, commiteados)
  manual_assets/      (crear: f3_curve.pdf, hardness_guides.pdf, factors.pdf,
                       site_guias.png, site_resultados.png — generados, commiteados)
ica/public/guia-ica.pdf  (regenerar)
```

Dependencias entre tareas: T1 (fonts) → T2 (figuras las usan vía matplotlib) → T4 (el build referencia fonts + figuras + capturas de T2/T3) → T5 (revisión) → T6 (publicación) → T7 (merge + deploy).

---

### Task 1: Fuentes Inter estáticas para XeLaTeX

**Files:**
- Create: `ica/docs/guia/make_fonts.py`
- Create (generados): `ica/docs/guia/fonts/Inter-Regular.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`, `Inter-ExtraBold.ttf`

**Interfaces:**
- Consumes: `ica/public/fonts/inter-latin-wght-normal.woff2` (fuente variable 100–900 que sirve la app).
- Produces: `docs/guia/fonts/Inter-{Regular,SemiBold,Bold,ExtraBold}.ttf` — T2 los registra en matplotlib (`fonts/Inter-*.ttf`); T4 los referencia en fontspec con `Path=fonts/` y esos nombres de archivo exactos.

- [ ] **Step 1: Escribir `make_fonts.py`**

```python
#!/usr/bin/env python3
"""Genera instancias estáticas de Inter (400/600/700/800) desde el woff2 variable
que sirve la app (public/fonts/). El PDF usa literalmente la fuente de la web.
Salida: docs/guia/fonts/Inter-{Regular,SemiBold,Bold,ExtraBold}.ttf
Requiere: fontTools + brotli (ya instalados). Licencia Inter: SIL OFL (redistribuible).
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]          # repo ica/
SRC = ROOT / "public" / "fonts" / "inter-latin-wght-normal.woff2"
OUT = ROOT / "docs" / "guia" / "fonts"
WEIGHTS = {400: "Regular", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for wght, name in WEIGHTS.items():
        font = TTFont(SRC)                          # brotli descomprime woff2
        instantiateVariableFont(font, {"wght": wght}, inplace=True, updateFontNames=True)
        font.flavor = None                          # guardar como TTF plano
        dest = OUT / f"Inter-{name}.ttf"
        font.save(dest)
        check = TTFont(dest)
        assert "fvar" not in check, f"{dest.name} sigue siendo variable"
        print(f"  {dest.name}  wght={wght}")
    print("OK: 4 instancias Inter en", OUT)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Ejecutarlo y verificar**

```bash
cd /home/oscolv/ia/wqi/ica && python3 docs/guia/make_fonts.py
```
Esperado: 4 líneas `Inter-*.ttf wght=...` + `OK: 4 instancias Inter en .../docs/guia/fonts`. Sin AssertionError.

- [ ] **Step 3: Smoke test XeLaTeX (las fuentes cargan y se incrustan)**

```bash
mkdir -p /tmp/font-smoke && cat > /tmp/font-smoke/smoke.tex <<'EOF'
\documentclass{article}
\usepackage{fontspec}
\setmainfont{Inter}[Path=/home/oscolv/ia/wqi/ica/docs/guia/fonts/,
  UprightFont=Inter-Regular.ttf, BoldFont=Inter-Bold.ttf,
  FontFace={sb}{n}{Inter-SemiBold.ttf}, FontFace={eb}{n}{Inter-ExtraBold.ttf}]
\begin{document}
Agua viva: regular 400, \textbf{bold 700}, {\fontseries{sb}\selectfont semibold 600},
{\fontseries{eb}\selectfont extrabold 800} — 0123456789 ñandú índice.
\end{document}
EOF
cd /tmp/font-smoke && xelatex -interaction=nonstopmode -halt-on-error smoke.tex >/dev/null && pdffonts smoke.pdf
```
Esperado: xelatex termina sin error; `pdffonts` lista fuentes `Inter*` (subsets, `emb yes`).

- [ ] **Step 4: Commit**

```bash
cd /home/oscolv/ia/wqi/ica
git add docs/guia/make_fonts.py docs/guia/fonts/
git commit -m "feat(guía): instancias estáticas de Inter desde el woff2 de la app

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Figuras con la paleta «Agua viva» (auto-validadas)

**Files:**
- Create: `ica/docs/guia/make_figures.py`
- Create (generados): `ica/docs/guia/manual_assets/f3_curve.pdf`, `hardness_guides.pdf`, `factors.pdf`

**Interfaces:**
- Consumes: `docs/guia/fonts/Inter-*.ttf` (T1); `/home/oscolv/ia/wqi/{Data.csv,Guidelines.csv,ccme_wqi.py}` (material de análisis, fuera del repo; ruta configurable con `--wqi-dir`).
- Produces: `docs/guia/manual_assets/{f3_curve,hardness_guides,factors}.pdf` — T4 los referencia desde el `.tex` con `\includegraphics{manual_assets/...}` (mismos nombres que hoy; el cuerpo no cambia).

- [ ] **Step 1: Escribir `make_figures.py`**

```python
#!/usr/bin/env python3
"""Regenera las 3 figuras del manual ICA con la paleta «Agua viva» (tokens.css).

Mismos datos y fórmulas que las originales:
  - f3_curve.pdf        F3(nse) = nse/(0.01*nse+0.01), eje log, 4 puntos anotados.
  - hardness_guides.pdf Cd/Cu/Ni (fórmulas CCME) + Pb (escalones de Guidelines.csv);
                        banda gris = rango de dureza de Data.csv.
  - factors.pdf         F1/F2/F3 de Station1/Station2 calculados con ccme_wqi.py
                        (implementación de referencia validada; se verifica WQI=88).

Auto-validación: asserts sobre los valores del manual y de la caption del .tex;
si algo no cuadra, el script falla y NO se sustituye la figura.
"""
import argparse
import csv
import importlib.util
import math
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import numpy as np
from matplotlib import font_manager, pyplot as plt

ROOT = Path(__file__).resolve().parent              # docs/guia
FONTS = ROOT / "fonts"
ASSETS = ROOT / "manual_assets"
WQI = Path("/home/oscolv/ia/wqi")                   # material de análisis (fuera del repo)

# Tokens «Agua viva» (src/styles/tokens.css, tema claro)
INK, MUTED, LINE = "#0f2e3d", "#5b7a89", "#d7e5ea"
PRIMARY = "#0e7490"
S1, S2, S3, S4 = "#0e7490", "#dc2626", "#0f766e", "#7c3aed"   # --series-1..4


def setup_style():
    for ttf in FONTS.glob("Inter-*.ttf"):
        font_manager.fontManager.addfont(ttf)
    plt.rcParams.update({
        "font.family": "Inter", "text.color": INK,
        "axes.edgecolor": LINE, "axes.labelcolor": MUTED,
        "xtick.color": MUTED, "ytick.color": MUTED,
        "axes.grid": True, "grid.color": LINE, "grid.linewidth": 0.6,
        "axes.spines.top": False, "axes.spines.right": False,
        "font.size": 9, "figure.dpi": 200,
    })


def f3(nse):
    return nse / (0.01 * nse + 0.01)


def fig_f3_curve():
    assert round(f3(2.945 / 103), 1) == 2.8
    assert round(f3(1)) == 50 and round(f3(10)) == 91 and round(f3(88)) == 99
    x = np.logspace(-4, 2, 400)
    y = [f3(v) for v in x]
    pts = [(2.945 / 103, "ej. manual\nnse≈0.03 → 2.8"),
           (1, "nse=1 → 50"), (10, "nse=10 → 91"), (88, "nse=88 → 99")]
    fig, ax = plt.subplots(figsize=(6.4, 3.2))
    ax.semilogx(x, y, color=PRIMARY, lw=2)
    for xv, label in pts:
        ax.plot([xv], [f3(xv)], "o", ms=5, color=S2)
        ax.annotate(label, (xv, f3(xv)), textcoords="offset points",
                    xytext=(8, -16), fontsize=8, color=MUTED)
    ax.set_xlabel("nse (suma normalizada de excursiones)")
    ax.set_ylabel("$F_3$ (amplitud, 0–100)")
    ax.set_title("Función asintótica de escalado de $F_3$", color=INK, loc="left")
    ax.set_ylim(0, 108)
    fig.tight_layout()
    fig.savefig(ASSETS / "f3_curve.pdf")
    plt.close(fig)


# --- guías dependientes de la dureza (fórmulas del .tex / ccme_wqi.py) ---
def guide_cd(H):
    return 0.04 if H < 17 else 0.37 if H > 280 else 10 ** (0.83 * math.log10(H) - 2.46)


def guide_cu(H):
    return 2 if H < 82 else 4 if H > 180 else 0.2 * math.exp(0.8545 * math.log(H) - 1.465)


def guide_ni(H):
    return 25 if H <= 60 else 150 if H > 180 else math.exp(0.76 * math.log(H) + 1.06)


def pb_steps():
    """Escalones de plomo leídos de Guidelines.csv (LEAD_TOTAL_ugL, HARDNESS)."""
    steps = []
    with open(WQI / "Guidelines.csv", newline="") as f:
        for r in csv.DictReader(f):
            if r["PARAMETER_ID"] == "LEAD_TOTAL_ugL" and r["EXCEED_IF"] == "HARDNESS":
                lo = float(r["HARDNESS_LOWER"]) if r["HARDNESS_LOWER"].strip() else 0.0
                hi = float(r["HARDNESS_UPPER"]) if r["HARDNESS_UPPER"].strip() else math.inf
                steps.append((lo, hi, float(r["UPPER_LIMIT"])))
    steps.sort()
    assert [s[2] for s in steps] == [1.0, 2.0, 4.0, 7.0], steps
    return steps


def hardness_range():
    vals = []
    with open(WQI / "Data.csv", newline="") as f:
        for r in csv.DictReader(f):
            raw = (r.get("HARDNESS") or "").strip()
            if raw and not raw.startswith("<"):
                vals.append(float(raw))
    assert vals, "sin datos de dureza"
    return min(vals), max(vals)


def _band(ax, hmin, hmax):
    ax.axvspan(hmin, hmax, color=INK, alpha=0.06, lw=0)
    ax.axvline(hmax, color=MUTED, lw=0.8, ls=":")


def fig_hardness():
    assert abs(guide_cd(17) - 0.04) < 0.01 and abs(guide_cu(82) - 2) < 0.05
    assert guide_ni(60) == 25 and guide_ni(181) == 150
    H = np.linspace(10, 420, 500)
    hmin, hmax = hardness_range()
    steps = pb_steps()
    panels = [("Cadmio (CDHARDNESS)", [guide_cd(h) for h in H], S1),
              ("Cobre (CUHARDNESS)", [guide_cu(h) for h in H], S2),
              ("Níquel (NIHARDNESS)", [guide_ni(h) for h in H], S3)]
    fig, axes = plt.subplots(2, 2, figsize=(7.6, 5.2))
    fig.suptitle("Guías de metales dependientes de la dureza (banda gris: rango de estos datos)",
                 color=INK, fontsize=10)
    for ax, (title, y, color) in zip(axes.flat, panels):
        ax.plot(H, y, color=color, lw=1.8)
        _band(ax, hmin, hmax)
        ax.set_title(title, fontsize=9, color=INK)
        ax.set_xlabel("dureza (mg/L CaCO$_3$)", fontsize=8)
        ax.set_ylabel("guía (µg/L)", fontsize=8)
        ax.set_xlim(0, 420)
    ax = axes.flat[3]
    xs, ys = [], []
    for lo, hi, val in steps:
        xs += [max(lo, 0.0), min(hi, 420.0)]
        ys += [val, val]
    if xs[-1] < 420:
        xs.append(420.0)
        ys.append(steps[-1][2])
    ax.plot(xs, ys, color=S4, lw=1.8)
    _band(ax, hmin, hmax)
    ax.set_title("Plomo (HARDNESS, escalones)", fontsize=9, color=INK)
    ax.set_xlabel("dureza (mg/L CaCO$_3$)", fontsize=8)
    ax.set_ylabel("guía (µg/L)", fontsize=8)
    ax.set_xlim(0, 420)
    fig.tight_layout(rect=(0, 0, 1, 0.96))
    fig.savefig(ASSETS / "hardness_guides.pdf")
    plt.close(fig)


def load_engine(path):
    spec = importlib.util.spec_from_file_location("ccme_wqi", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def fig_factors(engine_path):
    mod = load_engine(engine_path)
    manual_wqi = mod.ccme_wqi(20.0, 4 / 103 * 100, f3(2.945 / 103))
    assert round(manual_wqi) == 88, manual_wqi      # motor de referencia íntegro
    res = mod.compute()
    s1, s2 = res["Station1"], res["Station2"]
    assert s1 and s2, "faltan Station1/Station2 en Data.csv"
    for name, s in (("Station1", s1), ("Station2", s2)):
        assert s["F3"] > 90, (name, s["F3"])        # caption .tex: «gobernado por F3»
        assert s["WQI"] < 45, (name, s["WQI"])      # caption .tex: resultado «Mala»
    labels = ["F1 · Scope", "F2 · Frequency", "F3 · Amplitude"]
    v1 = [s1["F1"], s1["F2"], s1["F3"]]
    v2 = [s2["F1"], s2["F2"], s2["F3"]]
    x = np.arange(3)
    w = 0.36
    fig, ax = plt.subplots(figsize=(6.4, 3.4))
    bars = [ax.bar(x - w / 2, v1, w, label="Station1", color=S1),
            ax.bar(x + w / 2, v2, w, label="Station2", color=S2)]
    for group in bars:
        for b in group:
            ax.annotate(f"{b.get_height():.0f}",
                        (b.get_x() + b.get_width() / 2, b.get_height()),
                        ha="center", va="bottom", fontsize=8, color=MUTED)
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel("valor del factor (0–100)")
    ax.set_ylim(0, 115)
    ax.set_title("Descomposición del índice por factor", color=INK, loc="left")
    ax.legend(frameon=False, fontsize=8)
    ax.grid(axis="x", visible=False)
    fig.tight_layout()
    fig.savefig(ASSETS / "factors.pdf")
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--wqi-dir", default=str(WQI),
                    help="carpeta del material de análisis (Data.csv, Guidelines.csv, ccme_wqi.py)")
    a = ap.parse_args()
    global WQI
    WQI = Path(a.wqi_dir)
    ASSETS.mkdir(parents=True, exist_ok=True)
    setup_style()
    fig_f3_curve()
    fig_hardness()
    fig_factors(WQI / "ccme_wqi.py")
    print("OK: f3_curve.pdf, hardness_guides.pdf, factors.pdf en", ASSETS)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Ejecutarlo (los asserts son la prueba)**

```bash
cd /home/oscolv/ia/wqi/ica && python3 docs/guia/make_figures.py
```
Esperado: `OK: f3_curve.pdf, hardness_guides.pdf, factors.pdf en .../docs/guia/manual_assets`. Si un assert falla (p. ej. `pb_steps` no lee [1,2,4,7] o las categorías no son «Mala»), NO continuar: reportar la discrepancia antes de tocar nada más.

- [ ] **Step 3: Verificar validez y aspecto de los PDFs**

```bash
cd /home/oscolv/ia/wqi/ica/docs/guia/manual_assets
for f in f3_curve hardness_guides factors; do pdfinfo $f.pdf | grep -E "Pages|Page size"; done
mkdir -p /tmp/fig-check && cd /tmp/fig-check
for f in f3_curve hardness_guides factors; do pdftoppm -png -r 80 /home/oscolv/ia/wqi/ica/docs/guia/manual_assets/$f.pdf $f; done
```
Esperado: cada PDF 1 página. Abrir los 3 PNG con Read y comprobar: curva teal con 4 puntos rojos y anotaciones legibles; 4 subplots con banda gris y escalones de Pb; barras teal/roja con F3≈100 — todo en Inter, sin espinas superiores/derechas.

- [ ] **Step 4: Commit**

```bash
cd /home/oscolv/ia/wqi/ica
git add docs/guia/make_figures.py docs/guia/manual_assets/
git commit -m "feat(guía): figuras regeneradas con la paleta «Agua viva»

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Capturas de la UI nueva (Playwright MCP, tarea inline)

**Nota de ejecución:** usa las herramientas MCP de Playwright (disponibles en esta sesión) y pasos interactivos con verificación visual — ejecútala inline, no la delegues a un subagente sin esas herramientas.

**Files:**
- Create: `ica/docs/guia/crop_shot.py`
- Create (generados): `ica/docs/guia/manual_assets/site_guias.png`, `site_resultados.png`

**Interfaces:**
- Consumes: `https://ica.endho.mx` en producción (tema claro por defecto en navegador limpio).
- Produces: `docs/guia/manual_assets/site_{guias,resultados}.png` — T4 los referencia con `\shot{manual_assets/...}` (mismos nombres que hoy).

- [ ] **Step 1: Escribir `crop_shot.py`**

```python
#!/usr/bin/env python3
"""Recorta una captura de Playwright al rectángulo CSS indicado.
Uso: crop_shot.py IN OUT --rect X Y W H     (coordenadas en px CSS; la imagen se escala sola)
"""
import argparse
from PIL import Image

VIEWPORT_CSS = 2560  # ancho del viewport de captura (browser_resize)

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("dest")
p.add_argument("--rect", type=int, nargs=4, required=True, metavar=("X", "Y", "W", "H"))
a = p.parse_args()

img = Image.open(a.src)
scale = img.width / VIEWPORT_CSS
x, y, w, h = (round(v * scale) for v in a.rect)
img.crop((x, y, x + w, y + h)).save(a.dest, optimize=True)
print("OK:", a.dest, Image.open(a.dest).size)
```

- [ ] **Step 2: Preparar navegador limpio y viewport**

Con las herramientas MCP de Playwright:
1. `browser_navigate` → `https://ica.endho.mx`
2. `browser_resize` → width 2560, height 1440
3. `browser_snapshot` → si NO aparece «Elige un punto de partida» (había proyecto autoguardado), ejecutar `browser_evaluate` con `() => { localStorage.clear(); location.reload(); }` y esperar recarga.
4. Confirmar tema claro (fondo agua claro; si no, `localStorage` limpio lo garantiza).

- [ ] **Step 3: Captura de Guías (punto de partida)**

1. Verificar en el snapshot: textos «Elige un punto de partida», «CCME — Vida acuática», stepper ①②③ⓘ nuevo.
2. `browser_evaluate`:
   `() => { const r = document.querySelector('.shell').getBoundingClientRect(); return JSON.stringify([r.x, r.y, r.width, r.height]); }`
   Anotar el rectángulo `[X, Y, W, H]`.
3. `browser_take_screenshot` con `fullPage: true`, `filename: "guias_raw.png"`, `scale: "css"`. Anotar la ruta absoluta que devuelve la herramienta.

- [ ] **Step 4: Cargar el ejemplo del manual y capturar Resultados**

1. `browser_snapshot` → localizar el tab «Ayuda» (botón con texto Ayuda); `browser_click` sobre él.
2. `browser_click` en el botón «Cargar ejemplo».
3. `browser_wait_for` texto «Ejemplo cargado».
4. `browser_click` en el tab «③ Resultados».
5. `browser_wait_for` texto «Resultados del WQI»; verificar en snapshot: gauge con **88**, chip **BUENA**, barras F1 20.0 / F2 3.9 / F3 2.8.
6. `browser_evaluate` (mismo snippet del rect de `.shell`) → anotar `[X, Y, W, H]`.
7. `browser_take_screenshot` `fullPage: true`, `filename: "resultados_raw.png"`, `scale: "css"`.

- [ ] **Step 5: Recortar a los assets finales**

```bash
cd /home/oscolv/ia/wqi/ica
python3 docs/guia/crop_shot.py <ruta/guias_raw.png> docs/guia/manual_assets/site_guias.png --rect X Y W H
python3 docs/guia/crop_shot.py <ruta/resultados_raw.png> docs/guia/manual_assets/site_resultados.png --rect X Y W H
```
(con los rectángulos anotados en los pasos 3 y 4).

- [ ] **Step 6: Verificación visual**

Abrir ambos PNG con Read. Esperado: `site_guias.png` muestra cabecera con pastilla ICA + stepper nuevo + las 4 tarjetas de punto de partida, tema claro, nítida (≥2000 px de ancho antes de recortar); `site_resultados.png` muestra la tarjeta héroe con gauge 88 «BUENA» + barras F1/F2/F3. Sin restos de la UI vieja, sin tema oscuro.

- [ ] **Step 7: Commit**

```bash
cd /home/oscolv/ia/wqi/ica
git add docs/guia/crop_shot.py docs/guia/manual_assets/site_guias.png docs/guia/manual_assets/site_resultados.png
git commit -m "feat(guía): capturas de la UI «Agua viva» para el manual

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Reescritura LaTeX (preámbulo, portada, partes, banners, chips) + build

**Files:**
- Create: `ica/docs/guia/build.sh`
- Modify: `ica/docs/guia/guia-ica.tex` — líneas 1–104 (preámbulo + portada), tabla de categorías (líneas 217–226) y colofón (línea 554). **El resto del cuerpo queda byte-idéntico.**

**Interfaces:**
- Consumes: `docs/guia/fonts/Inter-*.ttf` (T1), `docs/guia/manual_assets/*` (T2, T3).
- Produces: `docs/guia/guia-ica.pdf` — T6 lo copia a `public/guia-ica.pdf`. Comando de build: `docs/guia/build.sh` (desde cualquier cwd).

- [ ] **Step 1: Escribir `build.sh`**

```bash
#!/usr/bin/env bash
# Compila la guía ICA con XeLaTeX (dos pasadas: TOC + referencias).
set -euo pipefail
cd "$(dirname "$0")"
xelatex -interaction=nonstopmode -halt-on-error guia-ica.tex > /dev/null
xelatex -interaction=nonstopmode -halt-on-error guia-ica.tex
echo "OK: docs/guia/guia-ica.pdf"
```
`chmod +x docs/guia/build.sh`

- [ ] **Step 2: Sustituir el preámbulo completo (líneas 1–64)**

Reemplazar desde `\documentclass[11pt,a4paper]{article}` hasta la línea de `\newcommand{\shot}...` (inclusive) por:

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[spanish,provide=*]{babel}
\usepackage{amsmath,amssymb}
\usepackage{geometry}
\geometry{margin=2.3cm,headsep=14pt}
\usepackage{fontspec}
\usepackage{microtype}
\usepackage{pifont}
\usepackage{xcolor}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{colortbl}
\usepackage{array}
\usepackage{longtable}
\usepackage{enumitem}
\usepackage[most]{tcolorbox}
\usepackage{fancyhdr}
\usepackage{titlesec}
\usepackage{caption}
\usepackage{etoolbox}
\usepackage{tikz}
\usepackage{hyperref}

% ---- Tokens «Agua viva» (espejo de src/styles/tokens.css, tema claro) ----
\definecolor{agua}{HTML}{EEF7F7}      % --bg
\definecolor{agua2}{HTML}{E9F3F9}     % --bg2
\definecolor{ink}{HTML}{0F2E3D}       % --text
\definecolor{muted}{HTML}{5B7A89}     % --muted
\definecolor{primary}{HTML}{0E7490}   % --primary
\definecolor{accent}{HTML}{0D9488}    % --accent
\definecolor{line}{HTML}{D7E5EA}      % --line
% semáforo de categorías (solo calidad del agua) + tintas AA
\definecolor{catexcelente}{HTML}{0F766E}
\definecolor{catbuena}{HTML}{22C55E}   \definecolor{catbuenaink}{HTML}{052E16}
\definecolor{catregular}{HTML}{EAB308} \definecolor{catregularink}{HTML}{1F2937}
\definecolor{catmarginal}{HTML}{F97316}\definecolor{catmarginalink}{HTML}{431407}
\definecolor{catmala}{HTML}{DC2626}
% semánticos de validación
\definecolor{okink}{HTML}{15803D}
\definecolor{warnink}{HTML}{92600A}

% ---- Tipografía: la Inter real de la app (instancias en fonts/) ----
\setmainfont{Inter}[
  Path=fonts/,
  UprightFont=Inter-Regular.ttf,
  ItalicFont=Inter-Regular.ttf,
  BoldFont=Inter-Bold.ttf,
  BoldItalicFont=Inter-Bold.ttf,
  ItalicFeatures={FakeSlant=0.22},
  BoldItalicFeatures={FakeSlant=0.22},
  FontFace={sb}{n}{Inter-SemiBold.ttf},
  FontFace={sb}{it}{Inter-SemiBold.ttf},
  FontFace={eb}{n}{Inter-ExtraBold.ttf},
  FontFace={eb}{it}{Inter-ExtraBold.ttf},
  Color=ink]
\DeclareRobustCommand{\sbseries}{\fontseries{sb}\selectfont}
\DeclareTextFontCommand{\textsb}{\sbseries}
\DeclareRobustCommand{\ebseries}{\fontseries{eb}\selectfont}
\DeclareTextFontCommand{\texteb}{\ebseries}
% números tabulares en tablas (equivalente a 'tnum' en la web)
\AtBeginEnvironment{tabular}{\addfontfeature{Numbers=Tabular}}
\AtBeginEnvironment{longtable}{\addfontfeature{Numbers=Tabular}}

\hypersetup{colorlinks=true,linkcolor=primary,urlcolor=accent,citecolor=primary,
  pdftitle={Guia de referencia ICA - Indice de Calidad del Agua},pdfauthor={ICA}}
\DeclareCaptionFont{icasb}{\sbseries}
\captionsetup{font=small,labelfont={icasb,color=primary}}
\setlength{\parskip}{0.35em}
\setlength{\parindent}{0pt}
\arrayrulecolor{line}

% ---- Títulos ----
\titleformat{\section}{\color{primary}\Large\ebseries}{\thesection}{0.6em}{}[{\color{line}\titlerule[1pt]}]
\titleformat{\subsection}{\color{accent}\large\sbseries}{\thesubsection}{0.6em}{}
\titleformat{\subsubsection}{\color{muted}\normalsize\sbseries}{\thesubsubsection}{0.6em}{}

% Páginas de Parte: hoja suelta con fondo agua (gradiente como la web)
\titleclass{\part}{page}
\assignpagestyle{\part}{empty}
\titleformat{\part}[display]
  {\centering}
  {\begin{tikzpicture}[remember picture,overlay]
     \shade[top color=agua,bottom color=agua2,shading angle=160]
       (current page.south west) rectangle (current page.north east);
   \end{tikzpicture}%
   \vspace*{3.5cm}
   {\color{muted}\large\sbseries PARTE}\\[6pt]
   {\color{primary}\fontsize{84}{84}\selectfont\ebseries \thepart}}
  {18pt}
  {\color{ink}\fontsize{30}{37}\selectfont\ebseries}
  [{\vspace{10pt}{\color{accent}\rule{0.32\textwidth}{2.5pt}}}]

% ---- Cabeceras y pies ----
\newcommand{\icapill}{\tikz[baseline=(n.base)]\node[fill=primary,text=white,rounded corners=3.2pt,inner xsep=4pt,inner ysep=1.6pt,font=\scriptsize\ebseries](n){ICA};}
\pagestyle{fancy}\fancyhf{}
\lhead{\small\color{muted}\icapill~Índice de Calidad del Agua}
\rhead{\small\color{muted}\leftmark}
\lfoot{\small\color{muted}ica.endho.mx}
\rfoot{\small\color{muted}\thepage}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0.4pt}
\renewcommand{\headrule}{{\color{line}\hrule width\headwidth height\headrulewidth depth 0pt}}
\renewcommand{\footrule}{{\color{line}\hrule width\headwidth height\footrulewidth depth 0pt}}
\renewcommand{\sectionmark}[1]{\markboth{#1}{}}

% ---- Banners (antes «cajas»): fondo translúcido + título saturado, sin marco ----
% Mismos nombres de entorno -> el cuerpo no cambia.
\newtcolorbox{keybox}[1][]{enhanced,breakable,colback=primary!8,colframe=primary!8,
  boxrule=0pt,arc=6pt,left=8pt,right=8pt,top=6pt,bottom=7pt,
  coltitle=primary,fonttitle=\sbseries,colbacktitle=primary!8,
  title={#1},attach title to upper={\par\smallskip}}
\newtcolorbox{warnbox}[1][]{enhanced,breakable,colback=catregular!16,colframe=catregular!16,
  boxrule=0pt,arc=6pt,left=8pt,right=8pt,top=6pt,bottom=7pt,
  coltitle=warnink,fonttitle=\sbseries,colbacktitle=catregular!16,
  title={#1},attach title to upper={\par\smallskip}}
\newtcolorbox{okbox}[1][]{enhanced,breakable,colback=catbuena!13,colframe=catbuena!13,
  boxrule=0pt,arc=6pt,left=8pt,right=8pt,top=6pt,bottom=7pt,
  coltitle=okink,fonttitle=\sbseries,colbacktitle=catbuena!13,
  title={#1},attach title to upper={\par\smallskip}}
\newtcolorbox{sitebox}[1][]{enhanced,breakable,colback=accent!10,colframe=accent!10,
  boxrule=0pt,arc=6pt,left=8pt,right=8pt,top=6pt,bottom=7pt,
  coltitle=accent!70!black,fonttitle=\sbseries,colbacktitle=accent!10,
  title={#1},attach title to upper={\par\smallskip}}

% Ecuaciones: tarjeta blanca con borde --line (como las «tarjetas de código» de Ayuda)
\newcommand{\eqbox}[1]{\begin{tcolorbox}[enhanced,colback=white,colframe=line,boxrule=0.8pt,arc=6pt,
  left=8pt,right=8pt,top=4pt,bottom=4pt]#1\end{tcolorbox}}

% Capturas: tarjeta flotante (borde --line + sombra suave, como .card de la web)
\newcommand{\shot}[2]{\begin{center}\begin{tcolorbox}[enhanced,width=#2,colback=white,colframe=line,
  boxrule=0.6pt,arc=8pt,left=3pt,right=3pt,top=3pt,bottom=2pt,
  drop fuzzy shadow=muted!45]
  \centering\includegraphics[width=\linewidth]{#1}\end{tcolorbox}\end{center}}

% Chip de categoría: pastilla redonda con tinta AA (como .chip-cat de la web)
% \catchip[tinta]{fondo}{texto}   (tinta por defecto: blanca)
\newcommand{\catchip}[3][white]{\tikz[baseline=(n.base)]\node[fill=#2,text=#1,
  rounded corners=8pt,inner xsep=6.5pt,inner ysep=2.6pt,font=\footnotesize\sbseries](n){#3};}
```

- [ ] **Step 3: Sustituir la portada (bloque `\begin{titlepage}`…`\end{titlepage}`)**

```latex
\begin{titlepage}
\thispagestyle{empty}
\begin{tikzpicture}[remember picture,overlay]
  \shade[top color=agua,bottom color=agua2,shading angle=160]
    (current page.south west) rectangle (current page.north east);
\end{tikzpicture}%

\vspace*{1.8cm}
{\noindent\tikz[baseline=(n.base)]\node[left color=primary,right color=accent,text=white,
  rounded corners=7pt,inner xsep=11pt,inner ysep=6.5pt,font=\LARGE\ebseries](n){ICA};\par}

\vspace{1.5cm}
{\noindent\fontsize{38}{45}\selectfont\ebseries Índice de Calidad del Agua\par}
\vspace{10pt}
{\noindent\LARGE\color{primary}\sbseries Guía de referencia y manual de usuario\par}

\vspace{1.6cm}
\begin{tcolorbox}[enhanced,width=\textwidth,colback=white,colframe=white,boxrule=0pt,
  arc=10pt,left=16pt,right=16pt,top=13pt,bottom=13pt,drop fuzzy shadow=muted!45]
\large
Una aplicación web para calcular el \textbf{CCME Water Quality Index} directamente en el
navegador, orientada a aguas mexicanas y desarrollada como respuesta a la solicitud de un
\textbf{Índice de Calidad del Agua} para SEMARNAT.

\vspace{0.7em}
{\normalsize\color{muted}
Este documento reúne, en un solo lugar: el fundamento y las ecuaciones del índice; la
documentación completa del archivo de \emph{guías} (Guidelines) con sus tipos de regla y fórmulas;
un ejemplo validado de extremo a extremo; y una guía de uso del sitio \textbf{ica.endho.mx}.}
\end{tcolorbox}

\vfill
\begin{tcolorbox}[colback=white!55,colframe=white!55,arc=6pt,left=10pt,right=10pt,top=7pt,bottom=7pt]
\small
\textbf{Sitio:} \href{https://ica.endho.mx}{ica.endho.mx} \quad\textbullet\quad
\textbf{Código:} github.com/oscolv/ica \quad\textbullet\quad
\textbf{Privacidad:} todo el cálculo ocurre en tu navegador; ningún dato se sube a un servidor.
\end{tcolorbox}
{\small\color{muted}Documento de referencia técnica · \today}
\end{titlepage}
```

- [ ] **Step 4: Tabla de categorías con chips (sustituir el `center` de la tabla)**

Reemplazar el bloque `\begin{center}\renewcommand{\arraystretch}{1.25} ... \end{center}` de la sección «Categorías» por:

```latex
\begin{center}\renewcommand{\arraystretch}{1.7}
\begin{tabular}{@{}l l p{9.2cm}@{}}
\toprule
{\footnotesize\sbseries\color{muted}CATEGORÍA} & {\footnotesize\sbseries\color{muted}RANGO} & {\footnotesize\sbseries\color{muted}SIGNIFICADO} \\ \midrule
\catchip{catexcelente}{Excelente} & 95--100 & Ausencia virtual de amenaza; condiciones casi prístinas. \\
\catchip[catbuenaink]{catbuena}{Buena} & 80--94 & Grado menor de amenaza; rara vez se aparta de lo deseable. \\
\catchip[catregularink]{catregular}{Regular} & 65--79 & Ocasionalmente amenazada; a veces se aparta de lo deseable. \\
\catchip[catmarginalink]{catmarginal}{Marginal} & 45--64 & Frecuentemente amenazada o deteriorada. \\
\catchip{catmala}{Mala} & 0--44 & Casi siempre amenazada o deteriorada. \\ \bottomrule
\end{tabular}
\end{center}
```

- [ ] **Step 5: Colofón y barrido de colores viejos**

En el colofón final, cambiar `\begin{center}\small\color{icagray}` por `\begin{center}\small\color{muted}`.

Luego verificar que no queda ninguna referencia a la paleta vieja:

```bash
cd /home/oscolv/ia/wqi/ica/docs/guia
grep -nE "ica(blue|cyan|ink|gray|light|red|green|amber)" guia-ica.tex
```
Esperado: **cero coincidencias**. Si aparece alguna, sustituir por el token equivalente (icablue→primary, icacyan→accent, icaink→ink, icagray→muted, icalight→line, icared→warnink…).

- [ ] **Step 6: Compilar**

```bash
cd /home/oscolv/ia/wqi/ica && bash docs/guia/build.sh
```
Esperado: termina con `OK: docs/guia/guia-ica.pdf`, sin errores de LaTeX. (Warnings de fuentes/overfull se anotan para T5.)

- [ ] **Step 7: Verificar estructura del PDF**

```bash
pdfinfo /home/oscolv/ia/wqi/ica/docs/guia/guia-ica.pdf | grep -E "Title|Pages|Page size|File size"
pdffonts /home/oscolv/ia/wqi/ica/docs/guia/guia-ica.pdf | head -12
```
Esperado: A4; `Title` = «Guia de referencia ICA - Indice de Calidad del Agua»; páginas ≈15 (anotar el número real; un desplazamiento de ±1–2 es aceptable); fuentes `Inter*` incrustadas; tamaño < 3 MB.

- [ ] **Step 8: Commit**

```bash
cd /home/oscolv/ia/wqi/ica
git add docs/guia/build.sh docs/guia/guia-ica.tex
git commit -m "feat(guía): preámbulo «Agua viva» — Inter, tokens, banners, chips, portada con gradiente

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Revisión visual integral de las 15 páginas

**Files:**
- Modify (solo si hace falta corregir): `ica/docs/guia/guia-ica.tex`

**Interfaces:**
- Consumes: `docs/guia/guia-ica.pdf` (T4).
- Produces: el PDF final verificado, listo para T6.

- [ ] **Step 1: Renderizar todas las páginas**

```bash
mkdir -p /tmp/guia-review && cd /tmp/guia-review
pdftoppm -png -r 90 /home/oscolv/ia/wqi/ica/docs/guia/guia-ica.pdf pg
ls pg-*.png | wc -l
```

- [ ] **Step 2: Revisar página por página con Read (checklist)**

- **Portada:** gradiente agua cubre toda la hoja; pastilla ICA con degradado teal; título Inter 800 en tinta; tarjeta blanca con sombra suave; pie con sitio/código/privacidad legible.
- **TOC:** título en `primary`, entradas en tinta, sin desbordes.
- **5 páginas de Parte:** fondo agua a página completa, «PARTE» + número romano grande en `primary`, título display, filete `accent`; sin cabecera/pie (pagestyle empty).
- **Contenido:** cabecera con mini-pastilla + título a la izquierda y sección a la derecha en `muted`, reglas en `line`; pies con `ica.endho.mx` + página.
- **Banners:** keybox (teal), warnbox (ámbar, título `#92600A`), okbox (verde, título `#15803D`), sitebox (accent) — fondos translúcidos, radios visibles, título como primera línea en negrita, texto en tinta, corte de página limpio si alguno cruza (breakable).
- **Ecuaciones (`\eqbox`):** tarjeta blanca con borde `line` redondeado.
- **Tabla de categorías:** 5 chips pastilla con sus tintas (Buena/Marginal con tinta oscura), reglas de tabla en `line`.
- **Figuras:** nueva paleta e Inter; capturas con marco de tarjeta y sombra; la UI de las capturas es la nueva (stepper ✓, gauge).
- **Colofón:** en `muted`, sin colores viejos.
- **Enlaces:** `ica.endho.mx` y URLs visibles en color `accent` (no negros ni subrayados feos); enlaces internos de la TOC en `primary`.

- [ ] **Step 3: Corregir lo encontrado y recompilar**

Para cada defecto: ajuste puntual en `guia-ica.tex` (espaciados, `\vspace*`, `arc`, posiciones de chip con `baseline`, `overfull \hbox` > 20 pt visibles en el log) → `bash docs/guia/build.sh` → re-renderizar solo las páginas afectadas y re-verificar. Repetir hasta que la checklist pase completa.

- [ ] **Step 4: Revisar warnings graves del log**

```bash
grep -E "Overfull \\\\hbox \([2-9][0-9]" /home/oscolv/ia/wqi/ica/docs/guia/guia-ica.log | head
```
Esperado: ningún overfull ≥ 20 pt, o los que queden no son visibles en el render (verificado en Step 2).

- [ ] **Step 5: Commit (solo si hubo correcciones)**

```bash
cd /home/oscolv/ia/wqi/ica
git add docs/guia/guia-ica.tex
git commit -m "fix(guía): ajustes de maquetación tras revisión visual

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Publicación en la app (public/ + batería de verificación)

**Files:**
- Modify (regenerar): `ica/public/guia-ica.pdf`

**Interfaces:**
- Consumes: `docs/guia/guia-ica.pdf` (T5).
- Produces: `public/guia-ica.pdf` y `dist/guia-ica.pdf` (idénticos por sha256) — T7 despliega `dist/`.

- [ ] **Step 1: Copiar el PDF y verificar integridad**

```bash
cd /home/oscolv/ia/wqi/ica
cp docs/guia/guia-ica.pdf public/guia-ica.pdf
sha256sum docs/guia/guia-ica.pdf public/guia-ica.pdf
```
Esperado: hashes idénticos.

- [ ] **Step 2: Batería de la app (nada se rompió)**

```bash
cd /home/oscolv/ia/wqi/ica && npm run test 2>&1 | tail -5 && npm run lint 2>&1 | tail -3
```
Esperado: 176 tests en verde; lint sin errores. (El único test relacionado verifica `href="/guia-ica.pdf"` — no se toca código.)

- [ ] **Step 3: Build y verificación del artefacto en dist**

```bash
cd /home/oscolv/ia/wqi/ica && npm run build 2>&1 | tail -4
sha256sum public/guia-ica.pdf dist/guia-ica.pdf
```
Esperado: build OK; hashes idénticos (el PDF nuevo está en `dist/`).

- [ ] **Step 4: Espejo fuera del repo (spec §5)**

```bash
cp /home/oscolv/ia/wqi/ica/docs/guia/guia-ica.tex /home/oscolv/ia/wqi/guia-ica.tex
```
(La copia de `wqi/` queda como espejo de la canónica; no se borra nada.)

- [ ] **Step 5: Commit**

```bash
cd /home/oscolv/ia/wqi/ica
git add public/guia-ica.pdf
git commit -m "feat(guía): publica la guía PDF rediseñada con el lenguaje «Agua viva»

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Merge a main, deploy y verificación de producción

**Files:** ninguno nuevo (opera sobre git y Cloudflare).

**Interfaces:**
- Consumes: rama `redisenio-guia-pdf` completa (T1–T6), `dist/` construido en T6.
- Produces: `main` actualizado y empujado; `ica.endho.mx/guia-ica.pdf` sirviendo el PDF nuevo.

- [ ] **Step 1: Merge fast-forward a main**

```bash
cd /home/oscolv/ia/wqi/ica
git checkout main && git merge --ff-only redisenio-guia-pdf && git log --oneline -3
```
Esperado: fast-forward sin conflictos; los commits T1–T6 encima de `75f92fd`.

- [ ] **Step 2: Push a GitHub (convención del proyecto: merge → push)**

```bash
cd /home/oscolv/ia/wqi/ica && git push origin main
```
Nota: `main` estaba 11 commits por delante de `origin/main`; este push sube también esos (son del rediseño «Agua viva» ya desplegado — esperado).

- [ ] **Step 3: Deploy a Cloudflare Pages**

```bash
cd /home/oscolv/ia/wqi/ica && npm run build 2>&1 | tail -2
CLOUDFLARE_ACCOUNT_ID=d3c2debddb955347a2fb2650362530b1 npx wrangler pages deploy dist --project-name ica --branch main
```
Esperado: `✨ Deployment complete!` con URL del deployment.

- [ ] **Step 4: Verificar que producción sirve el PDF nuevo**

```bash
curl -sI https://ica.endho.mx/guia-ica.pdf | grep -iE "HTTP|content-length|content-type"
curl -s https://ica.endho.mx/guia-ica.pdf -o /tmp/guia-prod.pdf
sha256sum /home/oscolv/ia/wqi/ica/public/guia-ica.pdf /tmp/guia-prod.pdf
curl -sI https://ica.endho.mx/ | head -1
```
Esperado: `200` + `content-type: application/pdf`; hashes idénticos entre `public/` y lo servido; la app responde 200. (Si el hash difiere por caché de Cloudflare, esperar ~60 s y repetir el curl con `?v=$(date +%s)`.)

- [ ] **Step 5: Borrar la rama fusionada (convención del proyecto)**

```bash
cd /home/oscolv/ia/wqi/ica && git branch -d redisenio-guia-pdf
```

- [ ] **Step 6: Reporte final**

Resumir: páginas del PDF nuevo, peso final, URL verificada, commits en main, y cualquier observación de diseño que haya quedado (si la hay).
