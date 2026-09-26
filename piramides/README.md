# LAS PIRÁMIDES DE EGIPTO: LA TEORÍA

Video vertical de misterio para TikTok / Reels / Shorts, hecho sobre la locución
original (`piramides_audio_ok.mp3`, 160,6 s) con **seis respiros de ambiente**
metidos en la voz. **178,8 s · 9:16 · 720×1280 · 30 fps · H.264 + AAC · −14 LUFS ·
logo de la marca arriba a la derecha.**

Generado con **Higgsfield** (tope pedido: 600 créditos):

- 35 fotogramas con **Cinema Studio Image 2.5** (2k, 9:16): 70 créditos.
- 35 clips con **Kling 3.0 Pro** (9:16) con sonido propio (viento, arena,
  antorchas, zumbidos, piedra, tormenta…), sin música: 182 s, 455 créditos.
- **Total Higgsfield: 525 créditos.**
- Música: Higgsfield no tiene un modelo de música aparte, así que la banda
  sonora se hizo con **ElevenLabs Music v2 en Magnific** (180 s, instrumental,
  3.600 créditos de Magnific).

## Estructura

```
guion/planos.md           respiros y los 35 planos: cuándo entra cada uno y qué muestra
build/plan.py             cortes, pausas y la función mover() (voz original -> video)
build/planos.json         prompt de imagen y de movimiento/sonido de cada plano
build/palabras.json       tiempo de cada palabra en la voz original (corregido a mano)
build/hacer_spec.py       arma spec.json (textos en pantalla, fundidos)
build/montar.py           el montaje completo
manifiesto/               ids de cada generación
```

## Qué lleva el montaje

- **Respiros:** la voz se abre 2–3 s después de seis frases clave ("…que nadie ha
  podido explicar", "Sin brújula, sin máquinas", "…de dónde venía", "¿Para qué la
  hicieron?", "…con toda su historia", "Nadie ha entrado ahí"). En esos huecos el
  ambiente de los clips sube (×2,2) y la música baja un poco, para que la historia respire.
- **Look de película:** grade con sombras verde azuladas y luces ámbar, grano y
  viñeta; si un clip queda corto se estira en cámara lenta suave en vez de congelarse.
- Subtítulos palabra por palabra en amarillo; título "LA GRAN PIRÁMIDE" en dorado;
  datos en azul (+2.000.000 BLOQUES, 29.9792° N, 299.792 KM/S, π, CINTURÓN DE
  ORIÓN, 1968 · VON DÄNIKEN, SIN MOMIA, ¿10.000 AÑOS?, 2017, CÁMARA OCULTA);
  gancho "¿NO LA HICIMOS NOSOTROS?" y cierre "¿HUMANOS O VISITANTES?".
- Mezcla como en El Sombrerón: cada clip nivelado a −27 LUFS, bus de ambiente con
  compresor y limitador, música y ambiente que se agachan cuando habla la voz.

## Volver a montar

```bash
python3 hacer_spec.py urls.tsv > spec.json     # urls.tsv: P01..P35<TAB>url + MUS
python3 montar.py spec.json palabras.json salida.mp4
```

## Video final

https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/f2e850ae-ce78-4d5b-839d-595db9b048f8.mp4

Medido: voz −20 LUFS, ambiente −38 LUFS y música −32 LUFS antes de la
normalización; en el video final los tramos con voz quedan en −14 LUFS y los
respiros entre −20 y −26 LUFS (el ambiente se oye claro sin competir con la voz).
Sin cuadros congelados.

Copy para Facebook y YouTube: `../marca/DESCRIPCIONES_VIDEOS.md` (sección 6).
