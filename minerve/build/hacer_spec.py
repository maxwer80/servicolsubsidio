#!/usr/bin/env python3
"""Arma spec.json (línea de tiempo + textos) a partir de un TSV id<TAB>url."""
import json
import sys

VOZ = "https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/999a9ce2-cf52-4325-b081-58d752526e37.mp3"
CORTES = [("S01", 0.0), ("S02", 2.7), ("S03", 7.9), ("S04", 13.8), ("S05", 16.8), ("S06", 22.3),
          ("S07", 29.2), ("S08", 34.3), ("S09", 39.7), ("S10", 41.6), ("S11", 48.4), ("S12", 53.9),
          ("S13", 60.7), ("S14", 64.8), ("S15", 67.9), ("S16", 75.0), ("S17", 80.0), ("S18", 86.0),
          ("S19", 90.6), ("S20", 100.8), ("S21", 105.4)]
DURACION = 115.0

urls = dict(l.rstrip("\n").split("\t") for l in open(sys.argv[1]) if l.strip())
planos = []
for i, (pid, ini) in enumerate(CORTES):
    fin = CORTES[i + 1][1] if i + 1 < len(CORTES) else DURACION
    planos.append({"id": pid, "url": urls[pid], "ini": ini, "fin": fin})
spec = {
    "voz": VOZ, "musica": urls["MUS"], "duracion": DURACION,
    "tag": "MISTERIOS DEL MUNDO",
    "hook": {"ini": 0.2, "fin": 2.7, "texto": "A SOLO 45 KM\nDE SU BASE"},
    "titulo": {"ini": 22.5, "fin": 24.6, "texto": "EL MINERVE"},
    "datos": [
        {"ini": 3.1, "fin": 4.9, "texto": "07:55"},
        {"ini": 12.0, "fin": 13.8, "texto": "52 TRIPULANTES"},
        {"ini": 17.2, "fin": 22.2, "texto": "27 ENE 1968\nTOLÓN, FRANCIA"},
        {"ini": 39.8, "fin": 41.5, "texto": "SIN SEÑAL"},
        {"ini": 57.3, "fin": 60.6, "texto": "07:59"},
        {"ini": 80.8, "fin": 82.2, "texto": "51 AÑOS DESPUÉS"},
        {"ini": 82.4, "fin": 83.9, "texto": "JULIO 2019"},
        {"ini": 86.4, "fin": 90.5, "texto": "2.370 M DE\nPROFUNDIDAD"},
    ],
    "cierre": {"ini": 111.5, "texto": "¿EL ESPACIO…\nO EL OCÉANO?", "sub": "Dime en los comentarios qué te da más miedo"},
    "planos": planos,
}
print(json.dumps(spec, ensure_ascii=False))
