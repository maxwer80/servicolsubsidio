#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos + ambiente) a partir de un TSV id<TAB>url.

Los cortes y las pausas están en plan.py; los textos y efectos se escriben aquí
en tiempo de la voz ORIGINAL y se pasan al tiempo del video con mover()."""
import json
import sys

from plan import DURACION, PAUSAS, mover, planos

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/cf8b3cb5-edb0-4a92-af14-8f5b22571c21.mp3"
LOGO_ZIP = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/8a7662c9-cd09-4545-9d55-e1dbf8e5fdf3.zip"
FUNDIDOS = {"F01": (0.8, 0), "F48": (0.4, 0)}
DATOS = [
    (25.9, 29.7, "EILEAN MÒR · ESCOCIA"), (31.3, 34.6, "FARO NUEVO · 1899"),
    (46.1, 50.8, "15 DIC 1900 · FARO APAGADO"), (53.9, 57.4, "BARCO DE RELEVO: HESPERUS"),
    (59.4, 61.6, "26 DIC 1900"), (91.6, 96.4, "2 DE 3 IMPERMEABLES"),
    (103.6, 108.0, "LA LEYENDA"), (116.2, 121.4, "INVENTADO DESPUÉS"),
    (121.6, 124.8, "INFORME OFICIAL · 1900"), (127.7, 131.1, "+30 M SOBRE EL MAR"),
    (133.4, 136.6, "ROCA DE +1 TONELADA"),
]
# tramos dentro de la casa del faro (suena el ambiente interior)
INTERIOR = [(9.0, 11.4), (16.3, 18.9), (29.8, 31.2), (74.1, 96.5), (101.4, 124.9)]
# efectos: (clave del TSV, instante en la voz original, volumen)
EFECTOS = [("FX_PUERTA", 7.2, 0.6), ("FX_RELOJ", 9.1, 0.7), ("FX_SIRENA", 66.0, 0.8),
           ("FX_RELOJ", 78.5, 0.6), ("FX_OLA", 136.8, 1.0), ("FX_OLA", 139.9, 1.0)]


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
    "hook": {**tramo(0.2, 8.0), "texto": "¿DÓNDE ESTÁN\nLOS 3 FAREROS?"},
    "titulo": {**tramo(11.5, 15.0), "texto": "ISLAS FLANNAN"},
    "datos": [{**tramo(a, b), "texto": t} for a, b, t in DATOS],
    "cierre": {"ini": round(mover(154.2), 2), "texto": "¿QUÉ PASÓ\nEN FLANNAN?", "sub": "Te leo en los comentarios"},
    "ambiente": {
        "exterior": urls["AMB_EXT"], "interior": urls["AMB_INT"],
        "interior_tramos": [list(t) for t in INTERIOR],
        "efectos": [{"url": urls[k], "t": t, "vol": v} for k, t, v in EFECTOS],
    },
    "planos": lista,
}
print(json.dumps(spec, ensure_ascii=False))
