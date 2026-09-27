#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url.

Los cortes y las pausas están en plan.py; los textos se escriben aquí en tiempo
de la voz ORIGINAL y se pasan al tiempo del video con mover()."""
import json
import sys

from plan import DURACION, PAUSAS, mover, planos

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/806df393-8269-4933-804a-638c8d904593.mp3"
LOGO_ZIP = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/8a7662c9-cd09-4545-9d55-e1dbf8e5fdf3.zip"
FUNDIDOS = {"A01": (0.8, 0), "A36": (0.4, 0)}
DATOS = [
    (8.9, 11.7, "MONTE ARARAT · TURQUÍA"), (20.5, 24.6, "OCTUBRE 1959 · OTAN"),
    (34.3, 36.4, "157 METROS"), (39.9, 43.8, "300 CODOS = 157 M"),
    (45.8, 49.6, "1960 · DINAMITA"), (53.9, 58.9, "1977 · RON WYATT"),
    (73.5, 77.9, "RADAR · FUERZA AÉREA EE. UU."), (81.9, 83.5, "90°"),
    (86.7, 90.6, "TÚNEL DE ~75 M"), (91.2, 96.9, "6 M BAJO TIERRA"),
    (99.9, 103.9, "+40 % DE CARBONO"), (110.1, 113.4, "18 METROS"),
    (116.0, 118.7, "¿MADERA PETRIFICADA?"), (119.4, 125.0, "SIN CONFIRMAR"),
]


def tramo(a, b):
    return {"ini": round(mover(a), 2), "fin": round(mover(b), 2)}


urls = dict(l.rstrip("\n").split("\t")[:2] for l in open(sys.argv[1]) if l.strip())
lista = []
for pid, ini, fin in planos():
    f_in, f_out = FUNDIDOS.get(pid, (0, 0))
    lista.append({"id": pid, "url": urls[pid], "ini": ini, "fin": fin, "f_in": f_in, "f_out": f_out})
spec = {
    "voz": VOZ, "musica": urls["MUS"], "duracion": DURACION,
    "logo_zip": LOGO_ZIP, "logo_png": "04_logo_marca_de_agua.png",
    "tag": "MISTERIOS DEL MUNDO",
    "pausas": [list(p) for p in PAUSAS],
    "hook": {**tramo(0.2, 8.0), "texto": "¿Y SI ESTUVO\nEN UN VALLE?"},
    "titulo": {**tramo(12.0, 16.0), "texto": "EL ARCA DE NOÉ"},
    "datos": [{**tramo(a, b), "texto": t} for a, b, t in DATOS],
    "cierre": {"ini": round(mover(147.7), 2), "texto": "¿ROCA O\nARCA?", "sub": "Escribe PARTE 2 en los comentarios"},
    "planos": lista,
}
print(json.dumps(spec, ensure_ascii=False))
