import math
# pausas de ambiente: (punto de la voz original, segundos)
PAUSAS = [(25.2, 2.5), (70.3, 2.5), (100.8, 2.5), (139.6, 2.0)]
FIN_VOZ = 157.0
DURACION = 173.0
# cortes en tiempo de la voz ORIGINAL; la pausa alarga el plano que termina en ella
CORTES = [0.0, 3.6, 5.5, 7.1, 9.0, 11.4, 14.2, 16.3, 18.9, 21.3, 25.8, 29.8, 31.2, 34.7,
          38.0, 41.8, 46.0, 50.9, 53.8, 59.4, 61.7, 62.9, 65.9, 69.1, 70.9, 74.1, 75.9,
          78.4, 80.5, 85.0, 88.5, 91.5, 96.5, 101.4, 103.6, 108.0, 110.7, 116.1, 121.5,
          124.9, 131.2, 133.3, 136.7, 140.2, 144.2, 148.2, 151.9, 154.2]
LENTO_MAX = 1.2   # cuanto se puede estirar un clip (cámara lenta suave)


def mover(t):
    """Tiempo de la voz original -> tiempo del video (con las pausas metidas)."""
    return t + sum(d for p, d in PAUSAS if t >= p)


def planos():
    out = []
    for i, c in enumerate(CORTES):
        ini = mover(c) if i else 0.0
        fin = mover(CORTES[i + 1]) if i + 1 < len(CORTES) else DURACION
        out.append((f"F{i+1:02d}", round(ini, 2), round(fin, 2)))
    return out


def gen(dur):
    """Kling 2.5 solo genera 5 o 10 s."""
    return 5 if dur <= 5 * LENTO_MAX else 10


if __name__ == "__main__":
    tot = 0
    for pid, a, b in planos():
        g = gen(b - a); tot += 325 if g == 5 else 650
        print(pid, a, b, round(b - a, 2), g)
    print("planos", len(CORTES), "kling 1080p", tot, "imagenes", len(CORTES) * 75)
