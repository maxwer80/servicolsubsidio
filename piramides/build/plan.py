import math, json
# pausas de ambiente: (punto de la voz original, segundos)
PAUSAS = [(9.4, 2.5), (26.2, 2.0), (66.0, 3.0), (95.9, 2.5), (125.6, 3.0), (141.2, 3.0)]
FIN_VOZ = 160.6
DURACION = 178.8
# cortes en tiempo de la voz ORIGINAL; un plano que empieza en un punto de pausa la cubre
CORTES = [0.0, 6.0, 9.4, 16.1, 23.4, 26.2, 28.8, 33.5, 38.6, 40.6, 45.5, 50.4, 56.4, 62.0,
          66.0, 73.0, 76.4, 81.0, 85.2, 90.0, 95.9, 99.3, 104.6, 107.1, 111.6, 114.8, 120.5,
          125.6, 128.5, 132.6, 139.4, 141.2, 147.0, 152.7, 156.2]

def mover(t, incluir_punto=True):
    """Tiempo de la voz original -> tiempo del video (con las pausas metidas)."""
    return t + sum(d for p, d in PAUSAS if (t >= p if incluir_punto else t > p))

def planos():
    out = []
    for i, c in enumerate(CORTES):
        ini = mover(c) if i else 0.0
        fin = mover(CORTES[i + 1]) if i + 1 < len(CORTES) else DURACION
        out.append((f"P{i+1:02d}", round(ini, 2), round(fin, 2)))
    return out

if __name__ == "__main__":
    tot = 0
    for pid, a, b in planos():
        g = max(3, math.ceil(b - a + 0.3))
        tot += g
        print(pid, a, b, round(b - a, 2), g)
    print("seg", tot, "creditos", tot * 2.5, "+ imagenes", len(CORTES) * 2)
