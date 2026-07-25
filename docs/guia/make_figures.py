#!/usr/bin/env python3
"""Regenera las 3 figuras del manual ICA con la paleta «Agua viva» (tokens.css).

Mismos datos y fórmulas que las originales:
  - f3_curve.pdf        F3(nse) = nse/(0.01*nse+0.01), eje log, 4 puntos anotados.
  - hardness_guides.pdf Cd/Cu/Ni (fórmulas CCME) + Pb (escalones de Guidelines.csv);
                        banda gris = durezas altas (>180 mg/L), la región de meseta
                        de Cu/Ni/Pb (coherente con la caption del .tex).
  - factors.pdf         F1/F2/F3 de Station1/Station2 calculados con ccme_wqi.py
                        (implementación de referencia validada; se verifica WQI=88).

Auto-validación: asserts sobre los valores del manual y de la caption del .tex;
si algo no cuadra, el script falla y NO se sustituye la figura.

Nota: Guidelines.csv contiene un byte no-UTF-8 (Windows-1252) en la columna
UNIT_ID; se abre con errors="replace", igual que hace ccme_wqi.py (línea 123).
Las columnas leídas aquí son ASCII puro, así que el reemplazo no las afecta.
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

# Sin fecha de creación embebida: re-ejecutar produce PDFs byte-idénticos.
PDF_META = {"CreationDate": None}


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
    # ≈ y → van en mathtext: el woff2 latin de la app (y por tanto los TTF de T1)
    # no incluye U+2248/U+2192; mathtext los toma de DejaVu sin «tofu».
    # El primer punto lleva offset propio a la izquierda: con (8,-16) la etiqueta
    # de 2 líneas cae sobre las marcas del eje x (la curva vale ~3 ahí).
    pts = [(2.945 / 103, "ej. manual: nse$\\approx$0.03 $\\rightarrow$ 2.8", (-6, 9), "right"),
           (1, "nse=1 $\\rightarrow$ 50", (8, -16), "left"),
           (10, "nse=10 $\\rightarrow$ 91", (8, -16), "left"),
           (88, "nse=88 $\\rightarrow$ 99", (8, -16), "left")]
    fig, ax = plt.subplots(figsize=(6.4, 3.2))
    ax.semilogx(x, y, color=PRIMARY, lw=2)
    for xv, label, xytext, ha in pts:
        ax.plot([xv], [f3(xv)], "o", ms=5, color=S2)
        ax.annotate(label, (xv, f3(xv)), textcoords="offset points",
                    xytext=xytext, ha=ha, fontsize=8, color=MUTED)
    ax.set_xlabel("nse (suma normalizada de excursiones)")
    ax.set_ylabel("$F_3$ (amplitud, 0–100)")
    ax.set_title("Función asintótica de escalado de $F_3$", color=INK, loc="left")
    ax.set_ylim(0, 108)
    fig.tight_layout()
    fig.savefig(ASSETS / "f3_curve.pdf", metadata=PDF_META)
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
    # encoding/errors idénticos a ccme_wqi.py: el CSV tiene un byte Windows-1252.
    with open(WQI / "Guidelines.csv", newline="",
              encoding="utf-8", errors="replace") as f:
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


# Banda gris: región de meseta de las guías (caption del .tex: «durezas altas
# (>180 mg/L), donde cobre, níquel y plomo alcanzan su techo»). 180 = umbral de
# meseta de Cu/Ni/Pb; 400 = borde derecho, como en la figura original del manual.
BAND_LO, BAND_HI = 180.0, 400.0


def _band(ax, hmin, hmax):
    ax.axvspan(hmin, hmax, color=INK, alpha=0.06, lw=0)
    ax.axvline(hmax, color=MUTED, lw=0.8, ls=":")


def fig_hardness():
    assert abs(guide_cd(17) - 0.04) < 0.01 and abs(guide_cu(82) - 2) < 0.05
    assert guide_ni(60) == 25 and guide_ni(181) == 150
    H = np.linspace(10, 420, 500)
    hardness_range()  # sanity de datos (assert interno); la banda usa BAND_LO/HI
    steps = pb_steps()
    panels = [("Cadmio (CDHARDNESS)", [guide_cd(h) for h in H], S1),
              ("Cobre (CUHARDNESS)", [guide_cu(h) for h in H], S2),
              ("Níquel (NIHARDNESS)", [guide_ni(h) for h in H], S3)]
    fig, axes = plt.subplots(2, 2, figsize=(7.6, 5.2))
    fig.suptitle("Guías de metales dependientes de la dureza (banda gris: durezas altas, >180 mg/L)",
                 color=INK, fontsize=10)
    for ax, (title, y, color) in zip(axes.flat, panels):
        ax.plot(H, y, color=color, lw=1.8)
        _band(ax, BAND_LO, BAND_HI)
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
    _band(ax, BAND_LO, BAND_HI)
    ax.set_title("Plomo (HARDNESS, escalones)", fontsize=9, color=INK)
    ax.set_xlabel("dureza (mg/L CaCO$_3$)", fontsize=8)
    ax.set_ylabel("guía (µg/L)", fontsize=8)
    ax.set_xlim(0, 420)
    fig.tight_layout(rect=(0, 0, 1, 0.96))
    fig.savefig(ASSETS / "hardness_guides.pdf", metadata=PDF_META)
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
    fig.savefig(ASSETS / "factors.pdf", metadata=PDF_META)
    plt.close(fig)


def main():
    global WQI
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--wqi-dir", default=str(WQI),
                    help="carpeta del material de análisis (Data.csv, Guidelines.csv, ccme_wqi.py)")
    a = ap.parse_args()
    WQI = Path(a.wqi_dir)
    ASSETS.mkdir(parents=True, exist_ok=True)
    setup_style()
    fig_f3_curve()
    fig_hardness()
    fig_factors(WQI / "ccme_wqi.py")
    print("OK: f3_curve.pdf, hardness_guides.pdf, factors.pdf en", ASSETS)


if __name__ == "__main__":
    main()
