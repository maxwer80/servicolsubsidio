#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url.

Los cortes y las pausas están en plan.py; los textos se escriben aquí en tiempo
de la voz ORIGINAL y se pasan al tiempo del video con mover()."""
import json
import sys

from plan import DURACION, PAUSAS, mover, planos

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/9717fc89-caed-42b6-bbc9-1c1af85fee06.mp3"
LOGO_ZIP = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/8a7662c9-cd09-4545-9d55-e1dbf8e5fdf3.zip"
FUNDIDOS = {"M01": (0.8, 0), "M38": (0.4, 0)}
DATOS = [
    (30.9, 33.3, "584 DÍAS · VENUS"), (34.7, 36.6, "NASA: 583,92"), (37.5, 40.8, "EL CERO"),
    (45.8, 47.0, "EQUINOCCIO"), (62.2, 64.6, "1952 · PALENQUE"), (90.8, 94.0, "¿ASTRONAUTA?"),
    (106.2, 108.0, "21·12·2012"), (118.8, 120.2, "AÑO 900"), (152.6, 155.1, "+60.000 ESTRUCTURAS"),
    (158.3, 161.9, "2024 · CAMPECHE"),
]


def tramo(a, b):
    return {"ini": round(mover(a), 2), "fin": round(mover(b), 2)}


urls = dict(l.rstrip("\n").split("\t") for l in open(sys.argv[1]) if l.strip())
lista = []
for pid, ini, fin in planos():
    f_in, f_out = FUNDIDOS.get(pid, (0, 0))
    lista.append({"id": pid, "url": urls[pid], "ini": ini, "fin": fin, "f_in": f_in, "f_out": f_out})
spec = {
    "voz": VOZ, "musica": urls["MUS"], "duracion": DURACION,
    "logo_zip": LOGO_ZIP, "logo_png": "04_logo_marca_de_agua.png",
    "tag": "MISTERIOS DEL MUNDO",
    "pausas": [list(p) for p in PAUSAS],
    "hook": {**tramo(0.2, 6.3), "texto": "UN DÍA…\nSE FUERON"},
    "titulo": {**tramo(11.2, 13.4), "texto": "LOS MAYAS"},
    "datos": [{**tramo(a, b), "texto": t} for a, b, t in DATOS],
    "cierre": {"ini": round(mover(188.7), 2), "texto": "¿REY O\nASTRONAUTA?", "sub": "Escribe PARTE 2 en los comentarios"},
    "planos": lista,
}
print(json.dumps(spec, ensure_ascii=False))
