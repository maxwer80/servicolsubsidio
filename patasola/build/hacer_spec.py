#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url."""
import json
import sys

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/5510ed43-03e2-46c7-b556-a775112ca56f.mp3"
CORTES = [("P01", 0.0), ("P02", 7.4), ("P03", 12.0), ("P04", 16.7), ("P05", 24.3), ("P06", 31.4),
          ("P07", 34.9), ("P08", 37.5), ("P09", 41.6), ("P10", 50.2), ("P11", 56.9), ("P12", 64.0),
          ("P13", 67.1), ("P14", 73.2), ("P15", 78.0), ("P16", 86.2), ("P17", 96.2), ("P18", 103.5),
          ("P19", 107.0), ("P20", 111.6)]
DURACION = 118.5

urls = dict(l.rstrip("\n").split("\t") for l in open(sys.argv[1]) if l.strip())
hasta = float(sys.argv[2]) if len(sys.argv) > 2 else DURACION
planos = []
for i, (pid, ini) in enumerate(CORTES):
    fin = CORTES[i + 1][1] if i + 1 < len(CORTES) else DURACION
    if ini >= hasta:
        break
    planos.append({"id": pid, "url": urls[pid], "ini": ini, "fin": min(fin, hasta)})
spec = {
    "voz": VOZ, "musica": urls["MUS"], "duracion": hasta,
    "tag": "LEYENDAS DE COLOMBIA",
    "hook": {"ini": 0.2, "fin": 7.0, "texto": "LA LEYENDA MÁS TEMIDA\nDEL MONTE COLOMBIANO"},
    "titulo": {"ini": 22.7, "fin": 25.2, "texto": "LA PATASOLA"},
    "cierre": {"ini": 114.1, "texto": "¿TÚ TE ATREVERÍAS\nA AYUDARLA?", "sub": "Te leo en los comentarios"},
}
spec["planos"] = planos
print(json.dumps(spec, ensure_ascii=False))
