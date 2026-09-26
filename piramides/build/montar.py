#!/usr/bin/env python3
"""Monta "Las pirámides de Egipto: la teoría" (TikTok 9:16) a partir de los clips
generados en Higgsfield (Kling 3.0 Pro) y la voz en off original.

Corre en un sandbox con ffmpeg y la fuente Montserrat (el sandbox de Higgsfield
sirve). Sobre la base del montaje de El Sombrerón, este agrega:
- **respiros:** la voz se abre en los puntos de `pausas` (silencios de 2–3 s) y
  en esos huecos el ambiente de los clips sube y queda solo, para que la
  historia respire;
- cada clip se estira (cámara lenta suave, hasta 30 %) si le falta para llenar
  su plano, en vez de congelar el último cuadro;
- grade de cine con sombras verde azuladas y luces ámbar, grano y viñeta.

La mezcla sigue la de El Sombrerón: cada clip nivelado antes de juntarlo, bus
de ambiente con compresor y limitador propios, música y ambiente que se agachan
cuando habla la voz.

Uso:  python3 montar.py spec.json palabras.json salida.mp4
"""
import json
import os
import shlex
import subprocess
import sys

W, H, FPS = 720, 1280, 30
FUENTE = "Montserrat ExtraBold"
GRADE = ("eq=contrast=1.08:saturation=0.90:brightness=-0.02:gamma=0.97,"
         "colorbalance=rs=-0.04:bs=0.04:rh=0.06:gh=0.02:bh=-0.05,"
         "vignette=angle=PI/4,noise=alls=7:allf=t+u")
# nivel al que se deja el audio de cada clip antes de mezclarlo
NAT_LUFS = -27


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


def sonoridad(f):
    """Sonoridad integrada (LUFS) del audio de un archivo; None si es silencio."""
    r = subprocess.run(f"ffmpeg -hide_banner -nostats -i {shlex.quote(f)} -vn -af ebur128 -f null -",
                       shell=True, capture_output=True, text=True)
    resumen = r.stderr.split("Summary:")[-1]
    for linea in resumen.splitlines():
        if linea.strip().startswith("I:"):
            valor = linea.split()[1]
            try:
                v = float(valor)
            except ValueError:
                return None
            return v if v > -70 else None
    return None


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
Style: CAPV,{FUENTE},64,&H001E1ECC,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,1,0,1,5,4,2,50,50,400,1
Style: HOOK,{FUENTE},54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0.6,0,1,5,3,8,50,50,170,1
Style: TITULO,{FUENTE},84,&H0037AFD4,&H0037AFD4,&H00000000,&H96000000,0,0,0,0,100,100,4,0,1,6,6,5,40,40,0,1
Style: FIN,{FUENTE},66,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0.8,0,1,5,4,5,50,50,0,1
Style: FIN2,{FUENTE},38,&H0000E5FF,&H0000E5FF,&H00000000,&H96000000,0,0,0,0,100,100,0.5,0,1,3,2,5,50,50,0,1
Style: TAG,{FUENTE},26,&HB4FFFFFF,&HB4FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,1.5,0,1,2,1,7,40,40,60,1
Style: DATO,{FUENTE},50,&H00FFE14D,&H00FFE14D,&H00000000,&H96000000,0,0,0,0,100,100,1.5,0,1,4,3,8,40,40,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

CORTE = (".", ",", "…", ":", "?", "!", ";", '"')


def es_voz(p):
    return len(p) > 3 and p[3] == "V"


def trocear(palabras, max_pal=3, max_car=17, hueco=0.35):
    grupos, actual = [], []
    for i, p in enumerate(palabras):
        actual.append(p)
        texto = " ".join(x[2] for x in actual)
        sig = palabras[i + 1] if i + 1 < len(palabras) else None
        romper = (sig is None or len(actual) >= max_pal or p[2].endswith(CORTE)
                  or sig[0] - p[1] > hueco
                  or len(texto) + 1 + len(sig[2]) > max_car
                  or es_voz(sig) != es_voz(p))
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

    for d in spec.get("datos", []):
        ev.append(f"Dialogue: 2,{ass_tiempo(d['ini'])},{ass_tiempo(d['fin'])},DATO,,0,0,0,,"
                  r"{\fad(150,300)}" + limpiar(d["texto"]).replace("\n", r"\N"))

    grupos = trocear([p for p in palabras if p[0] < fin_caps - 0.05])
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
        # la voz del Sombrerón: roja y con un leve temblor al entrar
        estilo, efecto = ("CAPV", r"{\fad(60,0)\be1\t(0,300,\fscx104\fscy104)}") if es_voz(g[0]) \
            else ("CAP", r"{\fad(40,0)}")
        ev.append(f"Dialogue: 3,{ass_tiempo(ini)},{ass_tiempo(fin)},{estilo},,0,0,0,,"
                  + efecto + " ".join(partes))

    c = spec["cierre"]
    ev.append(f"Dialogue: 4,{ass_tiempo(c['ini'])},{ass_tiempo(dur)},FIN,,0,0,0,,"
              r"{\fad(250,0)\pos(360,560)}" + limpiar(c["texto"]).replace("\n", r"\N"))
    ev.append(f"Dialogue: 4,{ass_tiempo(c['ini'] + 1.2)},{ass_tiempo(dur)},FIN2,,0,0,0,,"
              r"{\fad(250,0)\pos(360,760)}" + limpiar(c["sub"]))
    with open(destino, "w", encoding="utf-8") as fh:
        fh.write(CABECERA + "\n".join(ev) + "\n")
    return destino


# ------------------------------------------------------------------- montaje
def mover(t, pausas):
    """Tiempo en la voz original -> tiempo en el video, con las pausas metidas."""
    return t + sum(d for p, d in pausas if t >= p)


def abrir_voz(src, pausas, dst):
    """Parte la voz en los puntos de `pausas` y mete silencio de esa duración."""
    if not pausas:
        return src
    cortes = [0.0] + [p for p, _ in pausas]
    n = len(cortes)
    partes = ["[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit="
              f"{n}" + "".join(f"[v{i}]" for i in range(n))]
    etiquetas = []
    for i, ini in enumerate(cortes):
        fin = f":end={cortes[i + 1]}" if i + 1 < n else ""
        partes.append(f"[v{i}]atrim=start={ini}{fin},asetpts=PTS-STARTPTS[s{i}]")
        etiquetas.append(f"[s{i}]")
        if i < len(pausas):
            partes.append(f"aevalsrc=0|0:s=44100:d={pausas[i][1]}[h{i}]")
            etiquetas.append(f"[h{i}]")
    filtro = ";".join(partes) + ";" + "".join(etiquetas) + f"concat=n={len(etiquetas)}:v=0:a=1[out]"
    sh(f"ffmpeg -y -v error -i {shlex.quote(src)} -filter_complex {shlex.quote(filtro)} "
       f"-map '[out]' -c:a pcm_s16le {shlex.quote(dst)}")
    return dst


def normalizar_plano(src, dst, largo, f_in=0.0, f_out=0.0):
    """Recorta al hueco exacto, aplica el grade y los fundidos a negro, y nivela
    su audio. Si el clip se queda corto lo estira (hasta 1,3x) y, si aún falta,
    congela el último cuadro."""
    audio = tiene_audio(src)
    lento = min(1.3, max(1.0, largo / max(duracion(src), 0.1)))
    estirar_v = f"setpts={lento:.4f}*PTS," if lento > 1.001 else ""
    estirar_a = f"atempo={1 / lento:.4f}," if lento > 1.001 else ""
    entrada_audio = "" if audio else "-f lavfi -i anullsrc=r=44100:cl=stereo "
    mapa_audio = "0:a" if audio else "1:a"
    fundidos_v, fundidos_a = "", ""
    if f_in:
        fundidos_v += f",fade=t=in:st=0:d={f_in}"
        fundidos_a += f",afade=t=in:st=0:d={f_in}"
    if f_out:
        fundidos_v += f",fade=t=out:st={largo - f_out:.3f}:d={f_out}"
        fundidos_a += f",afade=t=out:st={largo - f_out:.3f}:d={f_out}"
    # nivelado en dos pasos: se mide el clip y se le aplica la ganancia exacta
    # (loudnorm de una pasada deja clips cortos varios dB por encima)
    nivel = ""
    if audio:
        medido = sonoridad(src)
        if medido is not None:
            ganancia = max(-20.0, min(12.0, NAT_LUFS - medido))
            nivel = f"volume={ganancia:.1f}dB,alimiter=limit=0.5:attack=3:release=80:level=0,"
    sh(f"ffmpeg -y -v error -i {shlex.quote(src)} {entrada_audio}"
       f"-filter_complex \"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
       f"{estirar_v}fps={FPS},tpad=stop_mode=clone:stop_duration=3,trim=duration={largo:.3f},setpts=PTS-STARTPTS,"
       f"{GRADE}{fundidos_v},format=yuv420p[v];"
       f"[{mapa_audio}]aformat=sample_rates=44100:channel_layouts=stereo,{estirar_a}{nivel}apad,"
       f"atrim=duration={largo:.3f},asetpts=PTS-STARTPTS{fundidos_a}[a]\" "
       f"-map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p "
       f"-c:a pcm_s16le -ar 44100 -ac 2 -f matroska {shlex.quote(dst)}")


def montar(spec, palabras, trabajo, salida):
    os.makedirs(trabajo, exist_ok=True)
    partes = []
    for p in spec["planos"]:
        crudo = f"{trabajo}/{p['id']}_crudo.mp4"
        listo = f"{trabajo}/{p['id']}.mkv"
        if not os.path.exists(crudo):
            bajar(p["url"], crudo)
        normalizar_plano(crudo, listo, p["fin"] - p["ini"], p.get("f_in", 0), p.get("f_out", 0))
        partes.append(listo)
        print("plano", p["id"], flush=True)

    lista = f"{trabajo}/lista.txt"
    with open(lista, "w") as fh:
        fh.writelines(f"file '{os.path.abspath(x)}'\n" for x in partes)
    base = f"{trabajo}/base.mkv"
    sh(f"ffmpeg -y -v error -f concat -safe 0 -i {lista} -c copy {base}")

    voz = bajar(spec["voz"], f"{trabajo}/voz.mp3")
    musica = bajar(spec["musica"], f"{trabajo}/musica.mp3")
    logo = f"{trabajo}/logo.png"
    if not os.path.exists(logo):
        bajar(spec["logo_zip"], f"{trabajo}/marca.zip")
        sh(f"unzip -o -j -q {trabajo}/marca.zip '*{spec['logo_png']}' -d {trabajo} && "
           f"mv {trabajo}/{spec['logo_png']} {logo}")
    pausas = spec.get("pausas", [])
    voz = abrir_voz(voz, pausas, f"{trabajo}/voz_espaciada.wav")
    palabras = [[mover(p[0], pausas), mover(p[1], pausas)] + p[2:] for p in palabras]
    ass = construir_ass(spec, palabras, f"{trabajo}/subs.ass")

    dur = spec["duracion"]
    c_ini = spec["cierre"]["ini"]
    # respiros: en los huecos abiertos en la voz el ambiente sube y la musica baja un poco
    huecos = [(mover(p, pausas) - d, mover(p, pausas)) for p, d in pausas]
    en_hueco = "+".join(f"between(t,{a:.2f},{b:.2f})" for a, b in huecos) or "0"
    sube = f"volume='if({en_hueco},2.2,1)':eval=frame"
    baja = f"volume='if({en_hueco},0.75,1)':eval=frame"
    filtros = ";".join([
        # voz: limpia y un poco comprimida, sin moverla en el tiempo
        "[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,"
        "highpass=f=80,acompressor=threshold=0.1:ratio=3:attack=8:release=200,"
        f"apad=whole_dur={dur}[voz]",
        "[voz]asplit=3[voz1][llave1][llave2]",
        # musica de fondo: baja y se agacha cuando habla la voz
        "[2:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,"
        f"volume=0.15,afade=t=in:d=2,afade=t=out:st={dur - 3}:d=3,{baja},apad=whole_dur={dur}[mus0]",
        "[mus0][llave1]sidechaincompress=threshold=0.03:ratio=5:attack=30:release=700[mus]",
        # ambiente y foley de los clips (ya nivelados por plano): compresor y
        # limitador propios para que ningun golpe salte, volumen bajo
        "[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,"
        "highpass=f=35,lowpass=f=15000,"
        "acompressor=threshold=0.06:ratio=4:attack=5:release=180:makeup=1,"
        f"alimiter=limit=0.35:attack=3:release=80:level=0,volume=0.40,{sube}[nat0]",
        "[nat0][llave2]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=450[nat]",
        "[voz1][mus][nat]amix=inputs=3:normalize=0:dropout_transition=0,"
        "alimiter=limit=0.95:level=0,loudnorm=I=-14:TP=-1.5:LRA=11[aout]",
        # imagen: fundido de entrada, velo oscuro bajo la tarjeta final,
        # subtitulos y logo de la marca arriba a la derecha
        f"[0:v]fade=t=in:st=0:d=0.5,"
        f"drawbox=x=0:y=0:w=iw:h=ih:color=black@0.6:t=fill:enable='gte(t,{c_ini - 0.2})',"
        f"ass={shlex.quote(ass)}[vsub]",
        "[3:v]scale=200:-1,format=rgba,colorchannelmixer=aa=0.9[lg]",
        "[vsub][lg]overlay=W-w-24:36:format=auto,format=yuv420p[vout]",
    ])
    sh(f"ffmpeg -y -v error -i {base} -i {voz} -i {musica} -loop 1 -i {logo} "
       f"-filter_complex {shlex.quote(filtros)} "
       f"-map '[vout]' -map '[aout]' -c:v libx264 -preset medium -crf 21 -profile:v high "
       f"-pix_fmt yuv420p -r {FPS} -c:a aac -b:a 192k -ar 44100 -movflags +faststart "
       f"-t {dur} {shlex.quote(salida)}")
    return salida


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    palabras = json.load(open(sys.argv[2], encoding="utf-8"))
    salida = sys.argv[3] if len(sys.argv) > 3 else "/home/user/out/piramides.mp4"
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    montar(spec, palabras, "/home/user/trabajo", salida)
    print("listo", duracion(salida), os.path.getsize(salida), flush=True)


if __name__ == "__main__":
    main()
