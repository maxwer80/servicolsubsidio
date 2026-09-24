#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url."""
import json
import sys

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/601c1938-760c-4d5e-8f9d-d83ff107e250.mp3"
CORTES = [("M01", 0.0), ("M02", 4.1), ("M03", 10.9), ("M04", 19.1), ("M05", 24.2), ("M06", 28.0),
          ("M07", 35.1), ("M08", 38.5), ("M09", 43.0), ("M10", 46.7), ("M11", 53.2), ("M12", 56.8),
          ("M13", 60.9), ("M14", 68.1), ("M15", 78.5), ("M16", 85.4), ("M17", 95.3), ("M18", 99.2),
          ("M19", 105.5), ("M20", 109.8), ("M21", 117.4)]
DURACION = 128.5

urls = dict(l.rstrip("\n").split("\t") for l in open(sys.argv[1]) if l.strip())
planos = []
for i, (pid, ini) in enumerate(CORTES):
    fin = CORTES[i + 1][1] if i + 1 < len(CORTES) else DURACION
    planos.append({"id": pid, "url": urls[pid], "ini": ini, "fin": fin})
spec = {
    "voz": VOZ, "musica": urls["MUS"], "duracion": DURACION,
    "tag": "MISTERIOS DEL MUNDO",
    "hook": {"ini": 0.2, "fin": 4.0, "texto": "8 DE MARZO DE 2014\n00:41 · KUALA LUMPUR"},
    "titulo": {"ini": 119.4, "fin": 124.2, "texto": "VUELO\nMH370"},
    "datos": [
        {"ini": 8.3, "fin": 10.8, "texto": "239 A BORDO"},
        {"ini": 13.3, "fin": 14.5, "texto": "01:19"},
        {"ini": 21.6, "fin": 24.1, "texto": "«BUENAS NOCHES,\nMALAYSIAN 370»"},
        {"ini": 33.3, "fin": 35.0, "texto": "TRANSPONDEDOR: OFF"},
        {"ini": 45.0, "fin": 46.6, "texto": "GIRO DE 180°"},
        {"ini": 72.3, "fin": 78.3, "texto": "7 HORAS\nEN SILENCIO"},
        {"ini": 79.0, "fin": 80.8, "texto": "08:19"},
        {"ini": 92.5, "fin": 95.2, "texto": "120.000 KM²"},
    ],
    "cierre": {"ini": 124.3, "texto": "¿ACCIDENTE O\nALGO DELIBERADO?", "sub": "Déjame tu teoría en los comentarios"},
    "planos": planos,
}
print(json.dumps(spec, ensure_ascii=False))
