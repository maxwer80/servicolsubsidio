#!/usr/bin/env python3
"""Monta los capitulos de "La Llorona del Guayuriba" a partir de los clips y
voces generados en Higgsfield.

Corre dentro del sandbox de Higgsfield (sandbox_exec): descarga los mp4 y wav
desde el CDN, normaliza los planos a 10 s exactos, arma la pista de voz con su
procesamiento por personaje, agacha el audio nativo debajo de la voz, quema los
subtitulos y las tarjetas de gancho/cierre, y exporta un mp4 vertical 720x1280.

Uso:  python3 montar.py spec.json /home/user/out
"""
import json
import os
import shlex
import subprocess
import sys
import textwrap

W, H, FPS = 720, 1280, 24
SHOT = 10.0                      # duracion fija de cada plano
FUENTE = "Montserrat ExtraBold"  # instalada en el sandbox


def sh(cmd, **kw):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError(f"fallo: {cmd}\n{r.stderr[-3000:]}")
    return r.stdout


def bajar(url, destino, intentos=4):
    for i in range(intentos):
        r = subprocess.run(
            f"curl -fsS --retry 3 --max-time 180 -o {shlex.quote(destino)} {shlex.quote(url)}",
            shell=True, capture_output=True, text=True)
        if r.returncode == 0 and os.path.getsize(destino) > 1024:
            return destino
    raise RuntimeError(f"no se pudo bajar {url}")


def duracion(f):
    return float(sh(f"ffprobe -v error -show_entries format=duration -of csv=p=0 {shlex.quote(f)}").strip())


# ---------------------------------------------------------------- subtitulos
def trocear(texto, max_car=20):
    """Parte una linea en bloques cortos de 2-4 palabras, estilo TikTok."""
    bloques, actual = [], []
    for palabra in texto.split():
        tentativa = " ".join(actual + [palabra])
        if actual and (len(tentativa) > max_car or len(actual) >= 4):
            bloques.append(" ".join(actual))
            actual = [palabra]
        else:
            actual.append(palabra)
    if actual:
        bloques.append(" ".join(actual))
    return bloques


def ass_tiempo(t):
    t = max(0.0, t)
    h, resto = divmod(t, 3600)
    m, s = divmod(resto, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def ass_texto(s):
    return s.replace("{", "(").replace("}", ")").replace("\n", "\\N")


CABECERA_ASS = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CAP,{FUENTE},50,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0.6,0,1,4,3,2,60,60,330,1
Style: HOOK,{FUENTE},62,&H004DE8FF,&H004DE8FF,&H00000000,&H64000000,0,0,0,0,100,100,0.8,0,1,5,4,8,50,50,190,1
Style: END,{FUENTE},66,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,1.0,0,1,5,4,5,60,60,0,1
Style: TAG,{FUENTE},26,&HB4FFFFFF,&HB4FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0.5,0,1,2,1,7,42,42,44,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def linea_ass(ini, fin, estilo, texto, efecto=""):
    return (f"Dialogue: 0,{ass_tiempo(ini)},{ass_tiempo(fin)},{estilo},,0,0,0,,"
            f"{efecto}{ass_texto(texto)}")


def construir_ass(ep, voces, destino):
    ev = []
    # marca de serie permanente
    ev.append(linea_ass(0.6, 60.0, "TAG", ep["tag"]))
    # gancho de apertura
    ev.append(linea_ass(0.25, 3.0, "HOOK", ep["hook"], r"{\fad(180,220)}"))
    # subtitulos de la voz en off
    for v in voces:
        bloques = trocear(v["texto"])
        total = sum(len(b) for b in bloques) or 1
        t = v["inicio"]
        for b in bloques:
            dur = v["dur"] * len(b) / total
            ev.append(linea_ass(t, t + dur, "CAP", b))
            t += dur
    # tarjeta de cierre
    ev.append(linea_ass(ep["fin_ini"], 60.0, "END", ep["endcard"], r"{\fad(260,0)}"))
    with open(destino, "w", encoding="utf-8") as fh:
        fh.write(CABECERA_ASS + "\n".join(ev) + "\n")
    return destino


# ------------------------------------------------------------------- montaje
def normalizar_plano(src, dst):
    sh(f"ffmpeg -y -v error -i {shlex.quote(src)} -t {SHOT} "
       f"-vf scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},format=yuv420p "
       f"-c:v libx264 -preset medium -crf 20 -profile:v high -pix_fmt yuv420p "
       f"-af aresample=44100,apad -ac 2 -ar 44100 -c:a aac -b:a 160k "
       f"-movflags +faststart {shlex.quote(dst)}")


def cadena_voz(idx, v):
    """Procesado por personaje. La Llorona baja de tono y va con reverb."""
    ms = int(round(v["inicio"] * 1000))
    f = f"[{idx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,"
    if v["rol"] == "LLO":
        f += ("asetrate=44100*0.86,aresample=44100,atempo=1.163,"
              "aecho=0.8:0.88:70|150:0.45|0.25,highpass=f=110,volume=1.15,")
    elif v["rol"] == "ABU":
        f += "highpass=f=95,acompressor=threshold=0.09:ratio=3:attack=12:release=240,volume=1.05,"
    elif v["rol"] == "SAM":
        f += "highpass=f=85,acompressor=threshold=0.05:ratio=5:attack=5:release=180,volume=1.2,"
    else:  # NAR
        f += "highpass=f=85,acompressor=threshold=0.08:ratio=3.5:attack=10:release=220,volume=1.0,"
    f += f"adelay={ms}|{ms}[v{idx}]"
    return f


def montar(ep, base_url, trabajo, salida):
    os.makedirs(trabajo, exist_ok=True)

    # 1. planos
    partes = []
    for i, clip in enumerate(ep["clips"]):
        crudo = f"{trabajo}/crudo{i}.mp4"
        listo = f"{trabajo}/plano{i}.mp4"
        bajar(base_url + clip, crudo)
        normalizar_plano(crudo, listo)
        partes.append(listo)

    lista = f"{trabajo}/lista.txt"
    with open(lista, "w") as fh:
        for p in partes:
            fh.write(f"file '{os.path.abspath(p)}'\n")
    base = f"{trabajo}/base.mp4"
    sh(f"ffmpeg -y -v error -f concat -safe 0 -i {shlex.quote(lista)} -c copy {shlex.quote(base)}")

    # 2. voces
    voces = []
    for v in ep["vo"]:
        f = f"{trabajo}/vo_{v['id']}.wav"
        bajar(base_url + v["archivo"], f)
        voces.append({**v, "ruta": f, "dur": duracion(f)})

    ass = construir_ass(ep, voces, f"{trabajo}/subs.ass")

    # 3. mezcla + quemado
    entradas = f"-i {shlex.quote(base)} " + " ".join(f"-i {shlex.quote(v['ruta'])}" for v in voces)
    cadenas = [cadena_voz(i + 1, v) for i, v in enumerate(voces)]
    etiquetas = "".join(f"[v{i+1}]" for i in range(len(voces)))
    # apad: sin esto sidechaincompress corta el audio nativo al terminar la ultima voz
    cadenas.append(f"{etiquetas}amix=inputs={len(voces)}:normalize=0:dropout_transition=0,"
                   f"apad=whole_dur=62[voz]")
    cadenas.append("[voz]asplit=2[voz1][llave]")
    cadenas.append("[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=0.85[nat]")
    # el audio nativo se agacha automaticamente cuando entra la voz
    cadenas.append("[nat][llave]sidechaincompress=threshold=0.04:ratio=9:attack=15:release=420:makeup=1[natduck]")
    cadenas.append("[natduck][voz1]amix=inputs=2:normalize=0:dropout_transition=0,"
                   "alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
    scrim_ini, scrim_fin = ep["fin_ini"] - 0.3, 60.0
    cadenas.append(
        f"[0:v]drawbox=x=0:y=0:w=iw:h=ih:color=black@0.55:t=fill:"
        f"enable='between(t,{scrim_ini},{scrim_fin})',"
        f"ass={shlex.quote(ass)}[vout]")

    filtros = ";".join(cadenas)
    sh(f"ffmpeg -y -v error {entradas} -filter_complex {shlex.quote(filtros)} "
       f"-map '[vout]' -map '[aout]' -c:v libx264 -preset slow -crf 20 -profile:v high "
       f"-pix_fmt yuv420p -r {FPS} -c:a aac -b:a 192k -ar 44100 -movflags +faststart "
       f"-t 60 {shlex.quote(salida)}")
    return salida


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    destino = sys.argv[2] if len(sys.argv) > 2 else "/home/user/out"
    os.makedirs(destino, exist_ok=True)
    for ep in spec["episodios"]:
        out = f"{destino}/{ep['id']}.mp4"
        montar(ep, spec["base"], f"/home/user/trabajo/{ep['id']}", out)
        print(ep["id"], duracion(out), os.path.getsize(out), flush=True)


if __name__ == "__main__":
    main()
