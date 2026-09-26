# EL SOMBRERÓN

Video vertical de terror folclórico colombiano para TikTok / Reels / Shorts,
hecho sobre la voz en off original (`audio_el_sombreron.mp3`, 144 s).
**148,5 s · 9:16 · 720×1280 · 30 fps · H.264 + AAC · audio normalizado a −14 LUFS · logo de la marca arriba a la derecha.**

Imágenes, clips y música generados con **Magnific**:

- 3 láminas de personaje (Abel, la mamá y El Sombrerón con su caballo y los perros
  encadenados) con **Seedream 5 Pro 2k**, y 31 fotogramas clave con **Seedream 5 Pro 1.5k**;
  cada fotograma usa las láminas como referencia, así Abel y el Sombrerón se ven
  iguales en todos los planos.
- 31 clips con **Seedance 2.0 Mini** (720p, 9:16), cada uno a partir de su fotograma,
  con audio ambiente y foley propios (cadenas, cascos, perros, viento, cantina), sin música.
- Música de fondo con **ElevenLabs Music v2** (a través de Magnific), 150 s, instrumental.

El montaje (cortes, subtítulos, mezcla, logo) se hace con ffmpeg en `build/montar.py`.

## Estructura

```
guion/planos.md           los 31 planos: cuándo entra cada uno y qué muestra
build/palabras.json       tiempo de cada palabra (faster-whisper, corregido a mano)
build/hacer_spec.py       arma spec.json (línea de tiempo, textos, fundidos, silencios)
build/montar.py           el montaje completo
manifiesto/               ids de cada generación en Magnific
```

## Qué lleva el montaje

- **Look de película:** grade común con sombras frías y luces cálidas, contraste,
  viñeta y grano, para que los 31 planos se vean como una sola película.
- **Fundidos a negro** donde la historia lo pide: "Todo se puso negro" (116 s) y la
  vuelta al amanecer; fundido de entrada en el plano final.
- **Subtítulos** de 1 a 3 palabras que se pintan de amarillo al ritmo de la voz; las
  dos frases del Sombrerón ("Si te alcanzo… te lo pongo") salen **en rojo**.
- Gancho arriba en los primeros 4 s ("SI OYES CADENAS… NO CORRAS"), dato
  "ANTIOQUIA, COLOMBIA", título "EL SOMBRERÓN" en rojo cuando aparece (59,6 s) y
  tarjeta final "¿PARTE 2?" desde 143,9 s.
- **Mezcla equilibrada** (ambiente y foley más bajos y parejos):
  - el audio de cada clip se mide y se nivela a −27 LUFS antes de juntarlo, para que un golpe
    o un ladrido no suene mucho más fuerte que el viento del plano anterior;
  - el bus de ambiente tiene compresor y limitador propios y queda bajo;
  - música y ambiente se agachan solos cuando habla la voz (cadena lateral);
  - en "Silencio." (96,6–100,2 s) el fondo casi desaparece.

## Volver a montar o retocar

`montar.py` necesita ffmpeg con libass y la fuente Montserrat ExtraBold (el
sandbox de Higgsfield las tiene):

```bash
python3 hacer_spec.py urls.tsv > spec.json     # urls.tsv: id<TAB>url de cada clip + MUS
python3 montar.py spec.json palabras.json salida.mp4
```

Los volúmenes de la mezcla están en `montar.py` (`volume=0.15` la música,
`volume=0.40` el ambiente, `NAT_LUFS` el nivel de cada clip). Las URLs firmadas de
Magnific caducan: para volver a montar se sacan de nuevo con `creations_get`
usando los ids del manifiesto.

## Video final

https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/44dc674b-31c7-46fb-8b6a-e869ed20ff7d.mp4

Mezcla medida antes de la normalización final: voz −23 LUFS, ambiente/foley −38 LUFS,
música −32 LUFS; los 31 clips quedan en −27 LUFS ±2 salvo los que tienen fundido.

## Créditos Magnific

| Qué | Créditos |
|---|---|
| 3 láminas de personaje (Seedream 5 Pro 2k) | 300 |
| 31 fotogramas (Seedream 5 Pro 1.5k) | 2.325 |
| 31 clips Seedance 2.0 Mini 720p (166 s) | 23.240 |
| Música ElevenLabs v2 (150 s) | 3.000 |
| **Total** | **28.865** |

Copy para Facebook y YouTube: `../marca/DESCRIPCIONES_VIDEOS.md` (sección 5).
