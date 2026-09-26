# LOS MAYAS: LA CIVILIZACIÓN QUE DESAPARECIÓ

Video vertical de misterio para TikTok / Reels / YouTube, hecho sobre la locución
original (`mayas_audio.mp3`, 189,7 s) con **cinco respiros de ambiente** metidos
en la voz. **202,5 s · 9:16 · 720×1280 · 30 fps · H.264 + AAC · −14 LUFS · logo
de la marca arriba a la derecha.**

> Dura 3:22: en YouTube no entra como Short (máximo 3 min), se sube como video
> normal vertical. En Facebook y TikTok va sin problema.

Generado con **Higgsfield** (tope pedido: 600 créditos):

- 38 fotogramas con **Cinema Studio Image 2.5** (2k, 9:16); Chichén Itzá (M10)
  con **Nano Banana Pro**, que sí respeta monumentos reales. M10 y M26 se
  rehicieron tras revisarlos (salieron un obelisco y un templo asiático).
- 38 clips con **Kling 3.0 Pro** (9:16) con sonido propio (selva, aves,
  lluvia, eco de piedra, viento, fuego, agua del cenote…), sin música: 185 s.
- **Total Higgsfield: 544,5 créditos** (saldo antes 842,54 → después 298,04).
- Música: **ElevenLabs Music v2 en Magnific** (205 s, instrumental, 4.100
  créditos de Magnific), porque Higgsfield no tiene un modelo de música aparte.

## Estructura

```
guion/planos.md           respiros y los 38 planos: cuándo entra cada uno y qué muestra
build/plan.py             cortes, pausas y la función mover() (voz original -> video)
build/planos.json         prompt de imagen y de movimiento/sonido de cada plano
build/palabras.json       tiempo de cada palabra en la voz original (corregido a mano)
build/hacer_spec.py       arma spec.json (textos en pantalla, fundidos)
build/montar.py           el montaje completo (el mismo de las pirámides)
manifiesto/               ids de cada generación
```

## Qué lleva el montaje

- **Respiros:** la voz se abre 2–2,5 s después de cinco frases clave ("…y un día
  simplemente se fueron", "¿O un mensaje escrito en piedra?", "Un astronauta,
  tallado hace más de 1.300 años", "…y la selva se lo tragó todo", "¿Cuántas más
  quedan bajo la selva?"). En esos huecos el ambiente de los clips sube (×2,2) y
  la música baja un poco.
- **Look de película:** grade con sombras verde azuladas y luces ámbar, grano y
  viñeta; si un clip queda corto se estira en cámara lenta suave.
- Subtítulos palabra por palabra en amarillo; título "LOS MAYAS" en dorado;
  datos en azul (584 DÍAS · VENUS, NASA: 583,92, EL CERO, EQUINOCCIO,
  1952 · PALENQUE, ¿ASTRONAUTA?, 21·12·2012, AÑO 900, +60.000 ESTRUCTURAS,
  2024 · CAMPECHE); gancho "UN DÍA… SE FUERON" y cierre "¿REY O ASTRONAUTA?".
- Mezcla: cada clip nivelado a −27 LUFS, bus de ambiente con compresor y
  limitador, música y ambiente que se agachan cuando habla la voz.

## Volver a montar

```bash
python3 hacer_spec.py urls.tsv > spec.json     # urls.tsv: M01..M38<TAB>url + MUS
python3 montar.py spec.json palabras.json salida.mp4
```

## Video final

https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/f4543253-1cef-4af9-8d14-cb4e14d31264.mp4

Medido: el video final queda en −14,2 LUFS integrados, 202,5 s; los tramos con
voz en −14 LUFS y los respiros entre −24 y −29 LUFS (el ambiente se oye claro sin
competir con la voz). Sin cuadros congelados; hoja de contacto revisada (38 planos
verticales, subtítulos, logo y tarjeta de cierre en su sitio).

Miniaturas (YouTube, portada de Reel, post de Facebook):
https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/1c3ab1f1-0710-4424-9256-7ac79a042570.zip

Copy para Facebook y YouTube: `../marca/DESCRIPCIONES_VIDEOS.md` (sección 7).
