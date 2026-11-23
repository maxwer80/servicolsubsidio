#!/usr/bin/env python3
"""
Sincroniza por AUDIO los videos de varias cámaras (estilo PluralEyes).

Calcula cuánto está desplazada cada cámara respecto a la cámara maestra
comparando sus audios, y guarda el resultado en  multicam_sync.json  dentro
de la carpeta de los videos. Ese archivo lo lee  multicam.jsx  en Premiere.

Uso:
    python3 sincronizar_audio.py CARPETA [--maestra NOMBRE_ARCHIVO]
    python3 sincronizar_audio.py CARPETA --listar

Requiere numpy. Para leer el audio usa ffmpeg si está instalado; si no,
usa  afconvert  (viene con macOS; lee .mov / .mp4 / .m4a / .wav / .aif).
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import wave

import numpy as np

EXTENSIONES = {".mov", ".mp4", ".m4v", ".mxf", ".mts", ".m2ts", ".avi", ".mkv",
               ".wav", ".m4a", ".mp3", ".aif", ".aiff"}
SR = 8000          # frecuencia de análisis fino (Hz)
ENV_HOP = 40       # 8000/40 = 200 Hz para la envolvente (búsqueda gruesa)
VENTANA_FINA = 20  # segundos usados para afinar
MARGEN_FINO = 0.1  # segundos de búsqueda alrededor del resultado grueso
UMBRAL = 12       # confianza mínima para considerar fiable la sincronización


def listar(carpeta):
    nombres = [n for n in os.listdir(carpeta)
               if not n.startswith(".") and os.path.splitext(n)[1].lower() in EXTENSIONES]
    return sorted(nombres, key=str.lower)


def extraer_audio(ruta, tmpdir):
    salida = os.path.join(tmpdir, "a.wav")
    if shutil.which("ffmpeg"):
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", ruta, "-vn", "-ac", "1",
               "-ar", str(SR), "-acodec", "pcm_s16le", "-f", "wav", salida]
    elif shutil.which("afconvert"):
        cmd = ["afconvert", "-f", "WAVE", "-d", "LEI16@%d" % SR, "-c", "1", ruta, salida]
    else:
        sys.exit("No encontré ffmpeg ni afconvert para leer el audio.")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(salida):
        raise RuntimeError("no se pudo leer el audio (%s). Si es .MXF/.MTS instala ffmpeg: "
                           "brew install ffmpeg" % (r.stderr.strip()[:200] or "sin detalle"))
    with wave.open(salida, "rb") as w:
        datos = w.readframes(w.getnframes())
    os.remove(salida)
    x = np.frombuffer(datos, dtype="<i2").astype(np.float32)
    if len(x) < SR:
        raise RuntimeError("el archivo no tiene audio o dura menos de 1 segundo")
    return x - x.mean()


def envolvente(x):
    n = len(x) // ENV_HOP
    e = np.sqrt((x[:n * ENV_HOP].reshape(n, ENV_HOP) ** 2).mean(axis=1) + 1e-6)
    e = np.diff(np.log(e))  # cambios de volumen (golpes, sílabas): picos más nítidos
    return e - e.mean()


def correlacion(a, b, phat=False):
    """c[lag] = sum a[t]·b[t-lag]. Devuelve (c, lags)."""
    nfft = 1 << (len(a) + len(b) - 1).bit_length()
    R = np.fft.rfft(a, nfft) * np.conj(np.fft.rfft(b, nfft))
    if phat:
        R /= np.abs(R) + 1e-9
    c = np.fft.irfft(R, nfft)
    c = np.concatenate((c[-(len(b) - 1):], c[:len(a)])) if len(b) > 1 else c[:len(a)]
    lags = np.arange(-(len(b) - 1), len(a))
    return c, lags


def desfase(ref, cam):
    """Segundos desde el inicio de ref hasta el inicio de cam (puede ser negativo)."""
    # 1) búsqueda gruesa con la envolvente (robusta entre micrófonos distintos)
    ea, eb = envolvente(ref), envolvente(cam)
    c, lags = correlacion(ea, eb)
    # normaliza por cuánto se solapan, para no favorecer solapes cortos
    solape = np.minimum(len(ea), lags + len(eb)) - np.maximum(0, lags)
    minimo = min(len(ea), len(eb)) * 0.1
    c = np.where(solape > minimo, c / np.maximum(solape, 1), -np.inf)
    i = int(np.argmax(c))
    # confianza = pico principal / mejor pico fuera de ±2 s (>1.3 es fiable)
    lejos = np.abs(lags - lags[i]) > int(2 * SR / ENV_HOP)
    otros = c[lejos & np.isfinite(c)]
    segundo = otros.max() if otros.size else 0.0
    confianza = float(c[i] / segundo) if segundo > 0 else 99.0
    grueso = lags[i] * ENV_HOP / SR

    # 2) afinado a 1/8000 s con GCC-PHAT en una ventana del tramo común
    ini = max(0.0, grueso)
    fin = min(len(ref) / SR, grueso + len(cam) / SR)
    medio = (ini + fin) / 2
    mitad = min(VENTANA_FINA, fin - ini) / 2
    if mitad < 1:
        return grueso, confianza
    b0 = int((medio - grueso - mitad) * SR)
    b = cam[max(0, b0): b0 + int(2 * mitad * SR)]
    a0 = int((medio - mitad - MARGEN_FINO) * SR)
    a_ini = max(0, a0)
    a = ref[a_ini: a0 + int((2 * mitad + 2 * MARGEN_FINO) * SR)]
    c2, lags2 = correlacion(a, b, phat=True)
    # lag_esperado: posición de b dentro de a según la estimación gruesa
    lag_esperado = int(round(grueso * SR)) + max(0, b0) - a_ini
    rango = int(MARGEN_FINO * SR)
    m = (lags2 >= lag_esperado - rango) & (lags2 <= lag_esperado + rango)
    if not m.any():
        return grueso, confianza
    j = int(np.argmax(np.where(m, c2, -np.inf)))
    fino = (lags2[j] + a_ini - max(0, b0)) / SR
    # confianza: qué tan nítido es el pico frente al ruido de la correlación
    confianza = float(c2[j] / (np.std(c2) + 1e-12))
    return fino, confianza


def main():
    p = argparse.ArgumentParser(description="Sincroniza cámaras por audio")
    p.add_argument("carpeta")
    p.add_argument("--maestra", help="nombre del archivo de la cámara maestra")
    p.add_argument("--listar", action="store_true", help="solo lista los archivos")
    args = p.parse_args()

    carpeta = os.path.abspath(args.carpeta)
    nombres = listar(carpeta)
    if args.listar:
        print("\n".join(nombres))
        return
    if len(nombres) < 2:
        sys.exit("Se necesitan al menos 2 archivos de video/audio en: " + carpeta)

    maestra = args.maestra if args.maestra in nombres else nombres[0]
    print("Cámaras encontradas: %d   (maestra: %s)" % (len(nombres), maestra))

    tmpdir = tempfile.mkdtemp(prefix="multicam_")
    try:
        print("Leyendo audio de la maestra...")
        ref = extraer_audio(os.path.join(carpeta, maestra), tmpdir)
        resultados = {}
        descartadas = []
        for n in nombres:
            if n == maestra:
                resultados[n] = (0.0, None)
                continue
            print("Sincronizando %s ..." % n, end=" ", flush=True)
            try:
                cam = extraer_audio(os.path.join(carpeta, n), tmpdir)
                d, conf = desfase(ref, cam)
                if conf >= UMBRAL:
                    resultados[n] = (d, conf)
                    print("desfase %+.3f s  (confianza %.0f)" % (d, conf))
                else:
                    descartadas.append(n)
                    print("NO SE PUDO SINCRONIZAR (confianza %.0f): se omite" % conf)
            except RuntimeError as e:
                descartadas.append(n)
                print("ERROR: %s (se omite)" % e)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    if len(resultados) < 2:
        sys.exit("No se pudo sincronizar ninguna cámara.")

    minimo = min(d for d, _ in resultados.values())
    clips = []
    for n in nombres:
        if n not in resultados:
            continue
        d, conf = resultados[n]
        clips.append({"name": n, "path": os.path.join(carpeta, n),
                      "offset": round(d - minimo, 4),
                      "confidence": None if conf is None else round(conf, 2)})

    salida = os.path.join(carpeta, "multicam_sync.json")
    with open(salida, "w") as f:
        json.dump({"version": 1, "master": maestra, "clips": clips}, f, indent=2)
    print("\nListo. Archivo guardado en:\n  " + salida)
    if descartadas:
        print("\nATENCIÓN: no coinciden con el audio de la maestra y quedaron fuera:\n  "
              + "\n  ".join(descartadas)
              + "\n(¿no comparten audio con la maestra? prueba con otra cámara maestra)")


if __name__ == "__main__":
    main()
