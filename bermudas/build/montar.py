#!/usr/bin/env python3
"""Monta "El Triángulo de las Bermudas" (TikTok 9:16) a partir de los clips
generados en Magnific y la voz en off original.

Corre en un sandbox con ffmpeg y la fuente Montserrat (el sandbox de Higgsfield
sirve): descarga los clips, recorta cada plano a su hueco exacto en la línea de
tiempo de la voz, aplica un grade común con grano, arma subtítulos palabra por
palabra (karaoke) desde palabras.json, mezcla voz + música + audio ambiente con
la voz agachando lo demás, y exporta un mp4 720x1280 listo para subir.

Uso:  python3 montar.py spec.json palabras.json salida.mp4
"""
import json
import os
import shlex
import subprocess
import sys

W, H, FPS = 720, 1280, 30
FUENTE = "Montserrat ExtraBold"
GRADE = ("eq=contrast=1.06:saturation=0.88:brightness=-0.02,"
         "vignette=angle=PI/4.5,noise=alls=5:allf=t+u")


def sh(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"fallo: {cmd}\n{r.stderr[-3000:]}")
    return r.stdout


def bajar(url, destino, intentos=4):
    for _ in range(intentos):
        r = subprocess.run(f"curl -fsS --retry 3 --max-time 240 -o {shlex.quote(destino)} {shlex.quote(url)}",
                           shell=True, capture_output=True, text=True)
        if r.returncode == 0 and os.path.getsize(destino) > 1024:
            return destino
    raise RuntimeError(f"no se pudo bajar {url}")


def duracion(f):
    return float(sh(f"ffprobe -v error -show_entries format=duration -of csv=p=0 {shlex.quote(f)}").strip())


def tiene_audio(f):
    return bool(sh(f"ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 {shlex.quote(f)}").strip())


# ---------------------------------------------------------------- subtitulos
def ass_tiempo(t):
    t = max(0.0, t)
    h, resto = divmod(t, 3600)
    m, s = divmod(resto, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def limpiar(s):
    return s.replace("{", "(").replace("}", ")")


CABECERA = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CAP,{FUENTE},60,&H0000E5FF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0.5,0,1,5,3,2,50,50,400,1
Style: HOOK,{FUENTE},54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0.6,0,1,5,3,8,50,50,170,1
Style: TITULO,{FUENTE},84,&H00FFE14D,&H00FFE14D,&H00000000,&H96000000,0,0,0,0,100,100,4,0,1,6,6,5,40,40,0,1
Style: FIN,{FUENTE},66,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0.8,0,1,5,4,5,50,50,0,1
Style: FIN2,{FUENTE},38,&H0000E5FF,&H0000E5FF,&H00000000,&H96000000,0,0,0,0,100,100,0.5,0,1,3,2,5,50,50,0,1
Style: DATO,{FUENTE},64,&H00FFE14D,&H00FFE14D,&H00000000,&H96000000,0,0,0,0,100,100,1.5,0,1,5,3,8,40,40,300,1
Style: TAG,{FUENTE},26,&HB4FFFFFF,&HB4FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,1.5,0,1,2,1,7,40,40,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

CORTE = (".", ",", "…", ":", "?", "!", ";", '"')


def trocear(palabras, max_pal=3, max_car=17, hueco=0.35):
    grupos, actual = [], []
    for i, p in enumerate(palabras):
        actual.append(p)
        texto = " ".join(x[2] for x in actual)
        sig = palabras[i + 1] if i + 1 < len(palabras) else None
        romper = (sig is None or len(actual) >= max_pal or p[2].endswith(CORTE)
                  or sig[0] - p[1] > hueco
                  or len(texto) + 1 + len(sig[2]) > max_car)
        if romper:
            grupos.append(actual)
            actual = []
    return grupos


def construir_ass(spec, palabras, destino):
    ev = []
    dur = spec["duracion"]
    fin_caps = spec["cierre"]["ini"]
    ev.append(f"Dialogue: 0,{ass_tiempo(0.3)},{ass_tiempo(fin_caps)},TAG,,0,0,0,,{spec['tag']}")
    h = spec["hook"]
    ev.append(f"Dialogue: 1,{ass_tiempo(h['ini'])},{ass_tiempo(h['fin'])},HOOK,,0,0,0,,"
              r"{\fad(200,300)}" + limpiar(h["texto"]).replace("\n", r"\N"))
    t = spec["titulo"]
    ev.append(f"Dialogue: 2,{ass_tiempo(t['ini'])},{ass_tiempo(t['fin'])},TITULO,,0,0,0,,"
              r"{\fad(120,400)\t(0,1800,\fscx108\fscy108)}" + limpiar(t["texto"]).replace("\n", r"\N"))

    # cifras clave que aparecen arriba mientras la voz las dice
    for d in spec.get("datos", []):
        ev.append(f"Dialogue: 2,{ass_tiempo(d['ini'])},{ass_tiempo(d['fin'])},DATO,,0,0,0,,"
                  r"{\fad(120,250)\t(0,500,\fscx106\fscy106)}" + limpiar(d["texto"]).replace("\n", r"\N"))

    grupos = [g for g in trocear([p for p in palabras if p[0] < fin_caps - 0.05])]
    for gi, g in enumerate(grupos):
        ini = g[0][0]
        fin = g[-1][1] + 0.25
        if gi + 1 < len(grupos):
            fin = min(fin, grupos[gi + 1][0][0])
        fin = min(fin, fin_caps)
        partes, cursor = [], ini
        for p in g:
            k = max(1, int(round((p[1] - cursor) * 100)))
            partes.append(r"{\k" + str(k) + "}" + limpiar(p[2].upper()))
            cursor = p[1]
        ev.append(f"Dialogue: 3,{ass_tiempo(ini)},{ass_tiempo(fin)},CAP,,0,0,0,,"
                  r"{\fad(40,0)}" + " ".join(partes))

    c = spec["cierre"]
    ev.append(f"Dialogue: 4,{ass_tiempo(c['ini'])},{ass_tiempo(dur)},FIN,,0,0,0,,"
              r"{\fad(250,0)\pos(360,560)}" + limpiar(c["texto"]).replace("\n", r"\N"))
    ev.append(f"Dialogue: 4,{ass_tiempo(c['ini'] + 1.6)},{ass_tiempo(dur)},FIN2,,0,0,0,,"
              r"{\fad(250,0)\pos(360,760)}" + limpiar(c["sub"]))
    with open(destino, "w", encoding="utf-8") as fh:
        fh.write(CABECERA + "\n".join(ev) + "\n")
    return destino


# ------------------------------------------------------------------- montaje
def normalizar_plano(src, dst, largo):
    """Recorta al hueco exacto; si el clip se queda corto, congela el ultimo cuadro."""
    audio = tiene_audio(src)
    entrada_audio = "" if audio else "-f lavfi -i anullsrc=r=44100:cl=stereo "
    mapa_audio = "0:a" if audio else "1:a"
    sh(f"ffmpeg -y -v error -i {shlex.quote(src)} {entrada_audio}"
       f"-filter_complex \"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
       f"fps={FPS},tpad=stop_mode=clone:stop_duration=3,trim=duration={largo:.3f},setpts=PTS-STARTPTS,"
       f"{GRADE},format=yuv420p[v];"
       f"[{mapa_audio}]aformat=sample_rates=44100:channel_layouts=stereo,apad,"
       f"atrim=duration={largo:.3f},asetpts=PTS-STARTPTS[a]\" "
       f"-map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p "
       f"-c:a pcm_s16le -ar 44100 -ac 2 -f matroska {shlex.quote(dst)}")


def montar(spec, palabras, trabajo, salida):
    os.makedirs(trabajo, exist_ok=True)
    partes = []
    for p in spec["planos"]:
        crudo = f"{trabajo}/{p['id']}_crudo.mp4"
        listo = f"{trabajo}/{p['id']}.mkv"
        bajar(p["url"], crudo)
        normalizar_plano(crudo, listo, p["fin"] - p["ini"])
        partes.append(listo)
        print("plano", p["id"], flush=True)

    lista = f"{trabajo}/lista.txt"
    with open(lista, "w") as fh:
        fh.writelines(f"file '{os.path.abspath(x)}'\n" for x in partes)
    base = f"{trabajo}/base.mkv"
    sh(f"ffmpeg -y -v error -f concat -safe 0 -i {lista} -c copy {base}")

    voz = bajar(spec["voz"], f"{trabajo}/voz.mp3")
    musica = bajar(spec["musica"], f"{trabajo}/musica.mp3")
    ass = construir_ass(spec, palabras, f"{trabajo}/subs.ass")

    dur = spec["duracion"]
    c_ini = spec["cierre"]["ini"]
    filtros = ";".join([
        # voz: limpia y un poco comprimida, sin moverla en el tiempo
        "[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,"
        "highpass=f=70,acompressor=threshold=0.1:ratio=3:attack=8:release=200,"
        f"volume=1.1,apad=whole_dur={dur}[voz]",
        "[voz]asplit=3[voz1][llave1][llave2]",
        # musica de fondo: baja cuando habla la voz
        "[2:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,"
        f"volume=0.42,afade=t=in:d=1.5,afade=t=out:st={dur - 3}:d=3,apad=whole_dur={dur}[mus0]",
        "[mus0][llave1]sidechaincompress=threshold=0.03:ratio=4:attack=30:release=600[mus]",
        # ambiente nativo de los clips: se agacha mas
        "[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=0.8[nat0]",
        "[nat0][llave2]sidechaincompress=threshold=0.03:ratio=9:attack=15:release=450[nat]",
        "[voz1][mus][nat]amix=inputs=3:normalize=0:dropout_transition=0,"
        "alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[aout]",
        # imagen: fundido de entrada, velo oscuro bajo la tarjeta final, subtitulos
        f"[0:v]fade=t=in:st=0:d=0.4,"
        f"drawbox=x=0:y=0:w=iw:h=ih:color=black@0.6:t=fill:enable='gte(t,{c_ini - 0.2})',"
        f"ass={shlex.quote(ass)}[vout]",
    ])
    sh(f"ffmpeg -y -v error -i {base} -i {voz} -i {musica} -filter_complex {shlex.quote(filtros)} "
       f"-map '[vout]' -map '[aout]' -c:v libx264 -preset medium -crf 21 -profile:v high "
       f"-pix_fmt yuv420p -r {FPS} -c:a aac -b:a 192k -ar 44100 -movflags +faststart "
       f"-t {dur} {shlex.quote(salida)}")
    return salida


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    palabras = json.load(open(sys.argv[2], encoding="utf-8"))
    salida = sys.argv[3] if len(sys.argv) > 3 else "/home/user/out/patasola.mp4"
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    montar(spec, palabras, "/home/user/trabajo", salida)
    print("listo", duracion(salida), os.path.getsize(salida), flush=True)


if __name__ == "__main__":
    main()
