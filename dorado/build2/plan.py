"""El Dorado parte 2: cortes sobre la voz de El Faraon (eleven_v4, 183,4 s) y respiros."""
import math

# respiros: (punto de la voz original, segundos de silencio que se abren)
# cada punto cae dentro de un silencio real de la voz (silencedetect -40 dB), no en los
# tiempos de whisper: en "1536" whisper se corria ~1 s y el corte partia la palabra
PAUSAS = [(20.5, 0.6), (65.8, 0.6), (94.9, 0.6), (122.4, 0.6), (148.8, 0.6)]
FIN_VOZ = 183.04
CIERRE = 179.7            # "¿Qué leyenda quieres…" (tiempo de la voz original)
DURACION = 190.5
LENTO_MAX = 1.2


def mover(t):
    """Tiempo de la voz original -> tiempo del video (con los respiros metidos)."""
    return t + sum(d for p, d in PAUSAS if t >= p)


def planos(lista):
    """lista: [(id, inicio_en_voz, ...)] -> [(id, ini, fin)] en tiempo del video."""
    out = []
    for i, p in enumerate(lista):
        ini = mover(p[1]) if i else 0.0
        fin = mover(lista[i + 1][1]) if i + 1 < len(lista) else DURACION
        out.append((p[0], round(ini, 2), round(fin, 2)))
    return out


def gen(dur, modelo):
    """Segundos a generar: Seedance 2.5 de 4 a 30 s, Kling 3.0 de 3 a 15 s."""
    minimo, maximo = (4, 30) if modelo == "S" else (3, 15)
    return max(minimo, min(maximo, math.ceil(dur - 0.2)))
