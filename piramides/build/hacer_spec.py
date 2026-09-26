#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url.

Los cortes y las pausas están en plan.py; los textos se escriben aquí en tiempo
de la voz ORIGINAL y se pasan al tiempo del video con mover()."""
import json
import sys

from plan import DURACION, PAUSAS, mover, planos

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/2aa0c652-df0d-4730-b87e-4c41d3add29b.mp3"
LOGO_ZIP = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/8a7662c9-cd09-4545-9d55-e1dbf8e5fdf3.zip"
FUNDIDOS = {"P01": (0.8, 0), "P35": (0.4, 0)}
DATOS = [
    (12.0, 14.0, "+2.000.000 BLOQUES"), (14.1, 16.1, "50 TONELADAS"), (21.3, 23.2, "HACE 4.500 AÑOS"),
    (30.0, 32.4, "29.9792° N"), (33.8, 37.8, "299.792 KM/S"), (44.2, 45.6, "π"),
    (52.2, 56.5, "CINTURÓN DE ORIÓN"), (66.6, 68.6, "1968 · VON DÄNIKEN"), (86.4, 88.3, "SIN MOMIA"),
    (115.0, 118.4, "¿10.000 AÑOS?"), (126.3, 128.3, "2017"), (133.0, 136.0, "CÁMARA OCULTA"),
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
    "hook": {**tramo(0.2, 5.2), "texto": "¿NO LA HICIMOS\nNOSOTROS?"},
    "titulo": {**tramo(10.1, 11.9), "texto": "LA GRAN\nPIRÁMIDE"},
    "datos": [{**tramo(a, b), "texto": t} for a, b, t in DATOS],
    "cierre": {"ini": round(mover(160.4), 2), "texto": "¿HUMANOS O\nVISITANTES?", "sub": "Escribe PARTE 2 en los comentarios"},
    "planos": lista,
}
print(json.dumps(spec, ensure_ascii=False))
