# EL TRIÁNGULO DE LAS BERMUDAS

Video vertical de misterio para TikTok / Reels / Shorts sobre la voz en off original
(`triangulo_de_las_vermudas.mp3`, 101,8 s).
**104 s · 9:16 · 720×1280 · 30 fps · H.264 + AAC · audio normalizado a −14 LUFS.**

Con presupuesto acotado (tope 35.000 créditos, gasto real ≈ 20.300), todo lo visual en **Magnific**:

- 17 fotogramas con **Seedream 5 Pro** a 1.5k.
- 17 clips con **Seedance 2.0 Mini** a 720p (la mitad de precio que Seedance 2.0 Pro),
  cada uno a partir de su fotograma, con audio ambiente propio y sin diálogo.
- Música de fondo con **ElevenLabs Music v2** (desde Magnific), 105 s, instrumental.

El montaje es el mismo proceso de `patasola/`, con una capa extra de cifras en
pantalla (1.000.000 KM², 5 DIC 1945, VUELO 19, 14 DESAPARECIDOS, +13, 8.000 M, 30 M)
que aparecen justo cuando la voz las dice.

## Estructura

```
guion/planos.md           los 17 planos: cuándo entra cada uno, qué muestra, qué cifra sale
build/palabras.json       tiempo de cada palabra (faster-whisper) → subtítulos karaoke
build/hacer_spec.py       línea de tiempo, gancho, título, cifras y tarjeta final
build/montar.py           el montaje completo (ffmpeg + libass)
manifiesto/               ids de cada generación en Magnific y desglose de créditos
```

## Volver a montar

```bash
python3 hacer_spec.py urls.tsv > spec.json     # urls.tsv: id<TAB>url de cada clip + MUS
python3 montar.py spec.json palabras.json salida.mp4
```

## Copy sugerido

`Más de 50 barcos y 20 aviones desaparecidos sin dejar rastro. ¿Accidentes o un secreto? 🌊✈️ #triangulodelasbermudas #misterio #vuelo19 #curiosidades #oceano #historia`
