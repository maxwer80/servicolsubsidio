#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url."""
import json
import sys

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/043f99e2-9262-46cb-a3ec-d5d52d131613.mp3"
LOGO_ZIP = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/8a7662c9-cd09-4545-9d55-e1dbf8e5fdf3.zip"
CORTES = [("S01", 0.0), ("S02", 4.2), ("S03", 10.0), ("S04", 12.3), ("S05", 17.8), ("S06", 22.9),
          ("S07", 27.9), ("S08", 31.6), ("S09", 34.3), ("S10", 37.5), ("S11", 42.0), ("S12", 46.3),
          ("S13", 51.9), ("S14", 57.9), ("S15", 59.4), ("S16", 63.9), ("S17", 67.2), ("S18", 71.6),
          ("S19", 77.5), ("S20", 81.4), ("S21", 84.0), ("S22", 89.9), ("S23", 96.8), ("S24", 102.3),
          ("S25", 106.9), ("S26", 109.6), ("S27", 117.5), ("S28", 124.2), ("S29", 129.8),
          ("S30", 138.2), ("S31", 143.0)]
DURACION = 148.5
# fundidos a negro (entrada, salida) por plano
FUNDIDOS = {"S26": (0, 1.3), "S27": (0.8, 0), "S31": (0.4, 0)}

urls = dict(l.rstrip("\n").split("\t") for l in open(sys.argv[1]) if l.strip())
planos = []
for i, (pid, ini) in enumerate(CORTES):
    fin = CORTES[i + 1][1] if i + 1 < len(CORTES) else DURACION
    f_in, f_out = FUNDIDOS.get(pid, (0, 0))
    planos.append({"id": pid, "url": urls[pid], "ini": ini, "fin": fin, "f_in": f_in, "f_out": f_out})
spec = {
    "voz": VOZ, "musica": urls["MUS"], "duracion": DURACION,
    "logo_zip": LOGO_ZIP, "logo_png": "04_logo_marca_de_agua.png",
    "tag": "LEYENDAS DE COLOMBIA",
    "hook": {"ini": 0.2, "fin": 4.2, "texto": "SI OYES CADENAS…\nNO CORRAS"},
    "titulo": {"ini": 59.6, "fin": 62.6, "texto": "EL SOMBRERÓN"},
    "datos": [{"ini": 10.2, "fin": 12.2, "texto": "ANTIOQUIA, COLOMBIA"}],
    "silencios": [[96.6, 100.2]],
    "cierre": {"ini": 143.9, "texto": "¿PARTE 2?", "sub": "Escribe PARTE 2 en los comentarios"},
    "planos": planos,
}
print(json.dumps(spec, ensure_ascii=False))
