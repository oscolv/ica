#!/usr/bin/env bash
# Compila la guía ICA con XeLaTeX (tres pasadas: TOC + referencias; la 2.ª aún
# mueve páginas al materializar la TOC y quedan etiquetas obsoletas — la 3.ª fija).
set -euo pipefail
cd "$(dirname "$0")"
xelatex -interaction=nonstopmode -halt-on-error guia-ica.tex > /dev/null
xelatex -interaction=nonstopmode -halt-on-error guia-ica.tex > /dev/null
xelatex -interaction=nonstopmode -halt-on-error guia-ica.tex
echo "OK: docs/guia/guia-ica.pdf"
