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
