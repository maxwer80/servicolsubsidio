#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url.

Los cortes y los respiros están en plan.py / planos.py; los textos se escriben aquí
en tiempo de la voz ORIGINAL y se pasan al tiempo del video con mover().
Los clips traen sonido nativo, así que no hay bloque "ambiente"."""
import json
import sys

from plan import CIERRE, DURACION, PAUSAS, mover, planos
from planos import P

VOZ = "https://raw.githubusercontent.com/maxwer80/servicolsubsidio/9730214/dorado/audio/faraon_v4_parte2.mp3"
LOGO_ZIP = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/8a7662c9-cd09-4545-9d55-e1dbf8e5fdf3.zip"
FUNDIDOS = {"E01": (0.8, 0), "E58": (0.4, 0)}
DATOS = [
    (0.2, 2.3, "1969 · PASCA, COLOMBIA"),
    (22.4, 25.9, "1541 · GONZALO PIZARRO"),
    (29.0, 31.6, "220 ESPAÑOLES"),
    (31.74, 35.6, "MILES DE CARGADORES"),
    (54.2, 59.9, "ORELLANA · EL AMAZONAS"),
    (60.72, 64.4, "REGRESAN UNOS 80"),
    (66.5, 72.2, "1561 · LOPE DE AGUIRRE"),
    (101.3, 104.7, "1580 · SEPÚLVEDA"),
    (108.06, 110.1, "−20 METROS"),
    (123.2, 128.4, "RALEIGH · GUAYANA"),
    (131.5, 135.8, "13 AÑOS PRESO"),
    (146.42, 148.2, "1618 · EJECUTADO"),
    (149.3, 153.2, "1904 · CONTRACTORS LTD"),
    (162.98, 164.4, "EN QUIEBRA"),
    (175.16, 177.2, "MUSEO DEL ORO · BOGOTÁ"),
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
    "hook": {**tramo(2.4, 12.3), "texto": "¿DÓNDE ESTABA\nEL DORADO?"},
    "titulo": {**tramo(14.84, 20.4), "texto": "EL DORADO · PARTE 2"},
    "datos": [{**tramo(a, b), "texto": t} for a, b, t in DATOS],
    "cierre": {"ini": round(mover(CIERRE), 2), "texto": "¿QUÉ LEYENDA\nSIGUE?",
               "sub": "Escríbela en los comentarios"},
    "planos": lista,
}
print(json.dumps(spec, ensure_ascii=False))
