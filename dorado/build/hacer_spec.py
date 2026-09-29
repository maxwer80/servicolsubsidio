#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url.

Los cortes y los respiros están en plan.py / planos.py; los textos se escriben aquí
en tiempo de la voz ORIGINAL y se pasan al tiempo del video con mover().
Los clips traen sonido nativo, así que no hay bloque "ambiente"."""
import json
import sys

from plan import CIERRE, DURACION, PAUSAS, mover, planos
from planos import P

VOZ = "https://raw.githubusercontent.com/maxwer80/servicolsubsidio/ecf5656/dorado/audio/faraon_v4.mp3"
LOGO_ZIP = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/8a7662c9-cd09-4545-9d55-e1dbf8e5fdf3.zip"
FUNDIDOS = {"D01": (0.8, 0), "D58": (0.4, 0)}
DATOS = [
    (0.3, 3.2, "LONDRES · 1618"),
    (24.5, 28.2, "GUATAVITA · COLOMBIA"),
    (28.3, 30.5, "SEGÚN LAS CRÓNICAS"),
    (53.2, 57.4, "UN RITUAL YA EN DESUSO"),
    (60.6, 65.6, "1528 · CARLOS V"),
    (65.8, 68.2, "LOS WELSER · BANQUEROS"),
    (69.4, 71.2, "PAGO: VENEZUELA"),
    (80.6, 85.9, "1536 · 800 HOMBRES"),
    (90.1, 93.3, "LLEGAN MENOS DE 200"),
    (95.0, 99.7, "≈ 1.800 ESMERALDAS"),
    (104.9, 109.4, "1539 · FEDERMANN"),
    (113.4, 117.3, "BELALCÁZAR · DESDE QUITO"),
    (117.4, 121.5, "3 EJÉRCITOS"),
    (126.1, 129.5, "PLEITO EN ESPAÑA"),
    (148.5, 149.7, "«MÁS LEJOS»"),
]


def tramo(a, b):
    return {"ini": round(mover(a), 2), "fin": round(mover(b), 2)}


urls = dict(l.rstrip("\n").split("\t")[:2] for l in open(sys.argv[1]) if l.strip())
lista = []
for pid, ini, fin in planos(P):
    f_in, f_out = FUNDIDOS.get(pid, (0, 0))
    lista.append({"id": pid, "url": urls[pid], "ini": ini, "fin": fin, "f_in": f_in, "f_out": f_out})
spec = {
    "voz": VOZ, "musica": urls["MUS"], "duracion": DURACION,
    "logo_zip": LOGO_ZIP, "logo_png": "04_logo_marca_de_agua.png",
    "tag": "MISTERIOS DEL MUNDO",
    "pausas": [list(p) for p in PAUSAS],
    "hook": {**tramo(3.3, 12.2), "texto": "¿EXISTIÓ\nEL DORADO?"},
    "titulo": {**tramo(16.9, 22.9), "texto": "EL DORADO · PARTE 1"},
    "datos": [{**tramo(a, b), "texto": t} for a, b, t in DATOS],
    "cierre": {"ini": round(mover(CIERRE), 2), "texto": "¿DÓNDE ESTÁ\nEL DORADO?",
               "sub": "Escribe PARTE 2 en los comentarios"},
    "planos": lista,
}
print(json.dumps(spec, ensure_ascii=False))
