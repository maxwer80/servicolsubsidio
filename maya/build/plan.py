import math
# pausas de ambiente: (punto de la voz original, segundos)
PAUSAS = [(10.7, 2.5), (61.85, 2.0), (94.4, 2.5), (130.8, 2.0), (166.25, 2.5)]
FIN_VOZ = 188.6
DURACION = 202.5
# cortes en tiempo de la voz ORIGINAL; la pausa alarga el plano que termina en ella
CORTES = [0.0, 3.5, 6.7, 11.1, 16.0, 21.2, 25.6, 29.4, 37.2, 41.4, 46.8, 52.2, 58.3, 61.9,
          65.0, 69.7, 73.7, 77.9, 82.0, 87.0, 90.6, 94.4, 99.6, 102.8, 108.3, 113.5, 118.5,
          126.6, 130.9, 134.7, 142.9, 149.4, 157.9, 163.9, 166.3, 175.0, 180.0, 184.0]
LENTO_MAX = 1.2   # cuanto se puede estirar un clip (cámara lenta suave)


def mover(t):
    """Tiempo de la voz original -> tiempo del video (con las pausas metidas)."""
    return t + sum(d for p, d in PAUSAS if t >= p)


def planos():
    out = []
    for i, c in enumerate(CORTES):
        ini = mover(c) if i else 0.0
        fin = mover(CORTES[i + 1]) if i + 1 < len(CORTES) else DURACION
        out.append((f"M{i+1:02d}", round(ini, 2), round(fin, 2)))
    return out


def gen(dur):
    return max(3, math.ceil(dur / LENTO_MAX - 0.15))


if __name__ == "__main__":
    tot = 0
    for pid, a, b in planos():
        g = gen(b - a); tot += g
        print(pid, a, b, round(b - a, 2), g)
    print("planos", len(CORTES), "seg", tot, "creditos", tot * 2.5 + len(CORTES) * 2)
