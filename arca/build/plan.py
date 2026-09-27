import math
# pausas de ambiente: (punto de la voz original, segundos)
PAUSAS = [(19.9, 2.5), (45.1, 2.5), (68.2, 2.0), (119.0, 2.5), (141.7, 2.0)]
FIN_VOZ = 151.2
DURACION = 166.5
# cortes en tiempo de la voz ORIGINAL; la pausa alarga el plano que termina en ella
CORTES = [0.0, 4.14, 8.8, 11.98, 16.72, 20.22, 26.04, 28.78, 34.16, 36.82, 39.68, 45.6,
          49.96, 53.06, 59.22, 65.38, 68.32, 73.08, 78.3, 83.7, 86.48, 91.0, 97.12, 99.54,
          104.0, 107.86, 110.04, 113.78, 115.94, 119.32, 125.22, 127.34, 134.18, 136.46,
          141.78, 147.66]
LENTO_MAX = 1.2   # cuanto se puede estirar un clip (cámara lenta suave)
MIN_GEN = 4       # Seedance: mínimo 4 s


def mover(t):
    """Tiempo de la voz original -> tiempo del video (con las pausas metidas)."""
    return t + sum(d for p, d in PAUSAS if t >= p)


def planos():
    out = []
    for i, c in enumerate(CORTES):
        ini = mover(c) if i else 0.0
        fin = mover(CORTES[i + 1]) if i + 1 < len(CORTES) else DURACION
        out.append((f"A{i+1:02d}", round(ini, 2), round(fin, 2)))
    return out


def gen(dur):
    return max(MIN_GEN, math.ceil(dur / LENTO_MAX - 0.15))


if __name__ == "__main__":
    tot = 0
    for pid, a, b in planos():
        g = gen(b - a); tot += g
        print(pid, a, b, round(b - a, 2), g)
    print("planos", len(CORTES), "seg", tot, "seedance fast 720p", tot * 235, "imagenes", len(CORTES) * 75)
