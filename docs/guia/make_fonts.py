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
