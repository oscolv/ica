#!/usr/bin/env python3
"""
Cálculo del CCME Water Quality Index (CCME WQI) — máxima fidelidad al
manual "CCME Water Quality Index, User's Manual – 2017 Update"
(convertido en markdown/wqimanualen/wqimanualen.md).

Algoritmo (idéntico al manual):
  F1 (Scope)     = (#parámetros que fallan / #parámetros totales) * 100      (ec. 1)
  F2 (Frequency) = (#tests que fallan     / #tests totales)     * 100        (ec. 2)
  F3 (Amplitude):
     excursion_i = (valor / objetivo) - 1     si no debe superar la guía      (ec. 3a)
     excursion_i = (objetivo / valor) - 1     si no debe caer por debajo      (ec. 3b)
     nse = sum(excursions) / #tests_totales                                   (ec. 4)
     F3  = nse / (0.01*nse + 0.01)                                            (ec. 5)
  CCME WQI = 100 - sqrt(F1^2 + F2^2 + F3^2) / 1.732                           (ec. 6)

Reglas del manual aplicadas:
  - Valores "<x" (menor que el límite de detección) se usan como el valor del
    límite de detección (manual, sec. "How the CCME WQI is influenced...").
  - Si el límite de detección resulta mayor que la guía, se usa el límite de
    detección como guía (mismo párrafo del manual).
  - Celdas vacías = dato faltante: se excluyen del conteo de tests.
  - Sólo se cuentan como "parámetros" los que tienen dato Y una guía aplicable.

Guías (Guidelines.csv). Los tipos con fórmula NO están en el manual del WQI;
se toman de las guías CCME para la protección de la vida acuática:
  - pHDependCCME (Aluminio, CCME 1987): pH<6.5 -> 0.005 mg/L ; pH>=6.5 -> 0.1 mg/L
  - CDHARDNESS (Cadmio):  10^(0.83*log10(H) - 2.46) ug/L, H acotada a [17,280]
  - CUHARDNESS (Cobre, CCME 1987): H<82 ->2 ; 82<=H<=180 ->0.2*e^(0.8545*ln H -1.465) ; H>180 ->4  (ug/L)
  - NIHARDNESS (Niquel, CCME 1987): H<=60 ->25 ; 60<H<=180 ->e^(0.76*ln H +1.06) ; H>180 ->150      (ug/L)
  - HARDNESS (Plomo, escalones de Guidelines.csv, por dureza)
  - SEASON (Fósforo, Turbidez): límite según la fecha del muestreo
  H = dureza (HARDNESS, mg/L como CaCO3) de esa misma muestra.

Salida: un CCME WQI por estación, combinando todas sus fechas.
"""

import csv
import math
import sys
from collections import defaultdict
from datetime import datetime

DATA_CSV = "/home/oscolv/ia/wqi/Data.csv"
GUIDE_CSV = "/home/oscolv/ia/wqi/Guidelines.csv"

# ---------------------------------------------------------------------------
# Mapeo columna-de-datos -> parámetro de Guidelines.csv (mismo id de columna)
# ---------------------------------------------------------------------------
# Columnas de Data.csv que NO son parámetros evaluables:
NON_PARAM = {"Station", "Date", "HARDNESS", "TEMP",
             "ALKALINITY_mgL", "ANTIMONY_TOTAL_ugL", "NITROGEN_TOTAL_mgL"}
# (Antimonio, Alcalinidad, Nitrógeno total, Temperatura y Dureza no tienen una
#  guía numérica aplicable en Guidelines.csv -> se excluyen del índice.)


def parse_value(raw):
    """Devuelve (valor_float, es_no_detectado) o (None, _) si falta el dato."""
    if raw is None:
        return None, False
    s = raw.strip()
    if s == "":
        return None, False
    nd = False
    if s[0] in "<L":            # "<0.01" o "L0.05" = por debajo de detección
        nd = True
        s = s[1:].strip()
    try:
        return float(s), nd
    except ValueError:
        return None, False


def parse_date(raw):
    for fmt in ("%m/%d/%Y", "%d-%b-%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw.strip(), fmt)
        except ValueError:
            continue
    raise ValueError(f"Fecha no reconocida: {raw!r}")


# ---------------------------------------------------------------------------
# Guías dependientes de dureza / pH (ecuaciones CCME)
# ---------------------------------------------------------------------------
def guide_cadmium(H):
    Hc = min(max(H, 17.0), 280.0)            # rango válido de la ecuación
    return 10 ** (0.83 * math.log10(Hc) - 2.46)          # ug/L


def guide_copper(H):
    if H < 82:
        return 2.0
    if H <= 180:
        return 0.2 * math.exp(0.8545 * math.log(H) - 1.465)
    return 4.0                                            # ug/L


def guide_nickel(H):
    if H <= 60:
        return 25.0
    if H <= 180:
        return math.exp(0.76 * math.log(H) + 1.06)
    return 150.0                                          # ug/L


def guide_aluminum(pH):
    return 0.005 if (pH is not None and pH < 6.5) else 0.1  # mg/L


def month_day(datestr):
    """'1-May' -> (5,1) para comparar rangos estacionales."""
    d = datetime.strptime(datestr.strip(), "%d-%b")
    return (d.month, d.day)


# ---------------------------------------------------------------------------
# Carga de Guidelines.csv
# ---------------------------------------------------------------------------
def load_guidelines():
    """Devuelve dict param_id -> lista de reglas (para los tipos con escalones/estación)."""
    rules = defaultdict(list)
    with open(GUIDE_CSV, newline="", encoding="utf-8", errors="replace") as f:
        for row in csv.DictReader(f):
            rules[row["PARAMETER_ID"]].append(row)
    return rules


def flt(x):
    x = (x or "").strip()
    return float(x) if x else None


def resolve_guideline(param, rules, H, pH, sample_date):
    """
    Devuelve (objetivo, modo) para 'param' en esta muestra.
      modo: 'max'  -> falla si valor > objetivo   (excursión 3a)
            'min'  -> falla si valor < objetivo   (excursión 3b)
            'range'-> (low, high) : falla si <low o >high
    Devuelve (None, None) si el parámetro no tiene guía aplicable.
    """
    recs = rules.get(param)
    if not recs:
        return None, None
    kind = recs[0]["EXCEED_IF"]

    if kind == ">":
        up = flt(recs[0]["UPPER_LIMIT"])
        return (up, "max") if up is not None else (None, None)
    if kind == "<":
        lo = flt(recs[0]["LOWER_LIMIT"])
        return (lo, "min") if lo is not None else (None, None)
    if kind == "<>":
        lo, up = flt(recs[0]["LOWER_LIMIT"]), flt(recs[0]["UPPER_LIMIT"])
        return ((lo, up), "range")
    if kind == "CDHARDNESS":
        return guide_cadmium(H), "max"
    if kind == "CUHARDNESS":
        return guide_copper(H), "max"
    if kind == "NIHARDNESS":
        return guide_nickel(H), "max"
    if kind == "pHDependCCME":
        return guide_aluminum(pH), "max"
    if kind == "HARDNESS":                    # escalones por dureza (Plomo)
        for r in recs:
            lo = flt(r["HARDNESS_LOWER"]) or 0.0
            hi = flt(r["HARDNESS_UPPER"])
            if H >= lo and (hi is None or H < hi):
                return flt(r["UPPER_LIMIT"]), "max"
        return None, None
    if kind == "SEASON":                      # límite según fecha (Fósforo, Turbidez)
        md = (sample_date.month, sample_date.day)
        for r in recs:
            start, fin = month_day(r["SEASON_START"]), month_day(r["SEASON_FINISH"])
            if start <= md <= fin:
                up = flt(r["UPPER_LIMIT"])
                return (up, "max") if up is not None else (None, None)
        return None, None
    # COMPUTE u otros no soportados / sin dato -> sin guía
    return None, None


# ---------------------------------------------------------------------------
# Motor de excursión (manual, ec. 3a/3b)
# ---------------------------------------------------------------------------
def test_excursion(value, objective, mode):
    """Devuelve (falla?, excursion). excursion=0 si no falla."""
    if mode == "max":
        if value > objective:
            return True, value / objective - 1.0
    elif mode == "min":
        if value < objective:
            return True, objective / value - 1.0
    elif mode == "range":
        lo, hi = objective
        if lo is not None and value < lo:
            return True, lo / value - 1.0
        if hi is not None and value > hi:
            return True, value / hi - 1.0
    return False, 0.0


def ccme_wqi(f1, f2, f3):
    return 100.0 - math.sqrt(f1 ** 2 + f2 ** 2 + f3 ** 2) / 1.732


def category(v):
    if v >= 95: return "Excellent"
    if v >= 80: return "Good"
    if v >= 65: return "Fair"
    if v >= 45: return "Marginal"
    return "Poor"


# ---------------------------------------------------------------------------
# Cálculo por estación
# ---------------------------------------------------------------------------
def compute():
    rules = load_guidelines()
    with open(DATA_CSV, newline="") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames
        rows = list(reader)

    param_cols = [c for c in columns if c not in NON_PARAM]

    stations = defaultdict(list)
    for r in rows:
        stations[r["Station"]].append(r)

    results = {}
    for station, srows in stations.items():
        failed_params = set()
        params_present = set()
        total_tests = 0
        failed_tests = 0
        excursions = []

        for r in srows:
            H, _ = parse_value(r.get("HARDNESS"))
            pH, _ = parse_value(r.get("PH"))
            try:
                sdate = parse_date(r["Date"])
            except ValueError:
                sdate = None

            for p in param_cols:
                value, nd = parse_value(r.get(p))
                if value is None:
                    continue                       # dato faltante -> excluido
                if H is None and rules.get(p, [{}])[0].get("EXCEED_IF") in (
                        "CDHARDNESS", "CUHARDNESS", "NIHARDNESS", "HARDNESS"):
                    continue                       # sin dureza no se puede evaluar
                obj, mode = resolve_guideline(p, rules, H, pH, sdate)
                if obj is None or mode is None:
                    continue                       # sin guía aplicable

                # Regla del manual: si el LD supera la guía, el LD pasa a ser la guía.
                if nd and mode == "max" and isinstance(obj, float) and value > obj:
                    obj = value

                params_present.add(p)
                total_tests += 1
                failed, exc = test_excursion(value, obj, mode)
                if failed:
                    failed_tests += 1
                    failed_params.add(p)
                    excursions.append(exc)

        n_params = len(params_present)
        if n_params == 0 or total_tests == 0:
            results[station] = None
            continue

        f1 = len(failed_params) / n_params * 100.0
        f2 = failed_tests / total_tests * 100.0
        nse = sum(excursions) / total_tests
        f3 = nse / (0.01 * nse + 0.01) if nse > 0 else 0.0
        wqi = ccme_wqi(f1, f2, f3)

        results[station] = dict(
            n_params=n_params, n_tests=total_tests,
            failed_params=sorted(failed_params), n_failed_tests=failed_tests,
            F1=f1, F2=f2, F3=f3, nse=nse, WQI=wqi, category=category(wqi),
        )
    return results


# ---------------------------------------------------------------------------
# Auto-verificación: reproduce el ejemplo del manual (Tabla 1) -> WQI = 88
# ---------------------------------------------------------------------------
def self_test():
    # Del manual: F1=20, F2=3.9, F3 a partir de nse con las 4 excursiones dadas.
    f1 = 2 / 10 * 100
    f2 = 4 / 103 * 100
    nse = (0.16 + 1.16 + 1.35 + 0.275) / 103
    f3 = nse / (0.01 * nse + 0.01)
    wqi = ccme_wqi(f1, f2, f3)
    ok = (round(f1) == 20 and round(f2, 1) == 3.9
          and round(f3, 1) == 2.8 and round(wqi) == 88)
    print(f"[self-test manual]  F1={f1:.0f}  F2={f2:.1f}  F3={f3:.1f}  "
          f"WQI={wqi:.1f}  ->  {'OK (=88)' if ok else 'FALLO'}")
    return ok


def main():
    self_test()
    print()
    results = compute()
    print(f"{'Station':<12}{'WQI':>7}  {'Cat.':<10}"
          f"{'F1':>6}{'F2':>6}{'F3':>7}  {'#par':>4}{'#test':>6}{'#fail':>6}")
    print("-" * 78)
    for st in sorted(results):
        r = results[st]
        if r is None:
            print(f"{st:<12}   sin datos suficientes")
            continue
        print(f"{st:<12}{r['WQI']:>7.1f}  {r['category']:<10}"
              f"{r['F1']:>6.1f}{r['F2']:>6.1f}{r['F3']:>7.2f}  "
              f"{r['n_params']:>4}{r['n_tests']:>6}{r['n_failed_tests']:>6}")
    print()
    for st in sorted(results):
        r = results[st]
        if r:
            print(f"{st}: parámetros que fallan -> {', '.join(r['failed_params'])}")


if __name__ == "__main__":
    sys.exit(0 if main() is None else 0)
