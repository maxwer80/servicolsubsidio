# LA PATASOLA

Video vertical de terror folclórico colombiano para TikTok / Reels / Shorts,
hecho sobre la voz en off original (`audio_pata_sola.mp3`, 117 s).
**118,5 s · 9:16 · 720×1280 · 30 fps · H.264 + AAC · audio normalizado a −14 LUFS.**

Imágenes, clips y música generados con **Magnific**:

- 4 láminas de personaje (Patasola, campesina, leñador, patrón) y 20 fotogramas clave
  con **Seedream 5 Pro**; cada fotograma usa las láminas como referencia, así las
  caras y el vestuario se mantienen iguales en todos los planos.
- 20 clips con **Seedance 2.0** (720p, 9:16), cada uno a partir de su fotograma y
  con audio ambiente propio (selva, lluvia, perros, fuego), sin diálogo ni música.
- Música de fondo con **ElevenLabs Music v2** (a través de Magnific), 120 s, instrumental.

El montaje (cortes, subtítulos, mezcla) se hace con ffmpeg en `build/montar.py`.

## Estructura

```
guion/transcripcion.tsv   la voz transcrita con tiempos (faster-whisper)
guion/planos.md           los 20 planos: cuándo entra cada uno y qué muestra
build/palabras.json       tiempo de cada palabra: con esto se arman los subtítulos
build/hacer_spec.py       arma spec.json (línea de tiempo + textos en pantalla)
build/montar.py           el montaje completo
manifiesto/               ids de cada generación en Magnific
```

## Qué lleva el montaje

- Cada plano entra y sale en las pausas de la narración (`guion/planos.md`).
- Subtítulos de 1 a 3 palabras en mayúsculas, que se pintan de amarillo al ritmo
  de la voz, por encima de la zona que tapan los botones de TikTok.
- Gancho arriba en los primeros 7 s, título "LA PATASOLA" cuando la voz dice su
  nombre (22,7 s), y tarjeta final "¿TÚ TE ATREVERÍAS A AYUDARLA?" desde 114 s.
- La voz manda: la música y el ambiente de los clips bajan solos cuando hay voz
  (compresión en cadena lateral).
- Grade común (contraste, viñeta, grano) para que los 20 planos se vean como una sola película.

## Volver a montar o retocar

`montar.py` necesita ffmpeg con libass y la fuente Montserrat ExtraBold (el
sandbox de Higgsfield las tiene):

```bash
python3 hacer_spec.py urls.tsv > spec.json     # urls.tsv: id<TAB>url de cada clip + MUS
python3 montar.py spec.json palabras.json salida.mp4
```

Los textos en pantalla (gancho, título, cierre) y los tiempos de corte están en
`hacer_spec.py`. Las URLs firmadas de Magnific caducan: para volver a montar se
sacan de nuevo con `creations_get` usando los ids del manifiesto.

## Copy sugerido

`Si escuchas a una mujer pidiendo ayuda en el monte… no vayas. 🦶🌿 #lapatasola #leyendascolombianas #terror #historiasdeterror #colombia #miedo`
