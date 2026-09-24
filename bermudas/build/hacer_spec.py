#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url."""
import json
import sys

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/9b328a09-c024-404f-b882-062c34be7140.mp3"
CORTES = [("B01", 0.0), ("B02", 7.2), ("B03", 14.7), ("B04", 19.6), ("B05", 23.7), ("B06", 28.4),
          ("B07", 35.2), ("B08", 41.3), ("B09", 45.0), ("B10", 49.9), ("B11", 53.2), ("B12", 62.1),
          ("B13", 68.6), ("B14", 76.0), ("B15", 83.5), ("B16", 91.0), ("B17", 95.9)]
DURACION = 104.0

urls = dict(l.rstrip("\n").split("\t") for l in open(sys.argv[1]) if l.strip())
planos = []
for i, (pid, ini) in enumerate(CORTES):
    fin = CORTES[i + 1][1] if i + 1 < len(CORTES) else DURACION
    planos.append({"id": pid, "url": urls[pid], "ini": ini, "fin": fin})
spec = {
    "voz": VOZ, "musica": urls["MUS"], "duracion": DURACION,
    "tag": "MISTERIOS DEL MUNDO",
    "hook": {"ini": 0.2, "fin": 7.0, "texto": "50 BARCOS · 20 AVIONES\nDESAPARECIDOS"},
    "titulo": {"ini": 11.7, "fin": 14.6, "texto": "EL TRIÁNGULO\nDE LAS BERMUDAS"},
    "datos": [
        {"ini": 15.2, "fin": 19.4, "texto": "1.000.000 KM²"},
        {"ini": 25.6, "fin": 28.3, "texto": "5 DIC 1945"},
        {"ini": 33.6, "fin": 35.1, "texto": "VUELO 19"},
        {"ini": 42.4, "fin": 44.9, "texto": "14 DESAPARECIDOS"},
        {"ini": 46.8, "fin": 49.8, "texto": "+13 EN EL RESCATE"},
        {"ini": 57.7, "fin": 61.9, "texto": "8.000 M DE ABISMO"},
        {"ini": 73.1, "fin": 75.9, "texto": "OLAS DE 30 M"},
    ],
    "cierre": {"ini": 100.0, "texto": "¿ACCIDENTES O\nUN SECRETO?", "sub": "Déjame tu teoría en los comentarios"},
    "planos": planos,
}
print(json.dumps(spec, ensure_ascii=False))
