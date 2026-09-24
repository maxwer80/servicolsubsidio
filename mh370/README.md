# VUELO MH370

Video vertical de misterio para TikTok / Reels / Shorts sobre la voz en off original
(`vuelo_malasia.mp3`, 124,6 s).
**128,5 s · 9:16 · 720×1280 · 30 fps · H.264 + AAC · audio normalizado a −14 LUFS.**

Mismas condiciones que `bermudas/`: tope de 35.000 créditos (gasto real ≈ 23.200),
todo lo visual en **Magnific**:

- 21 fotogramas con **Seedream 5 Pro** a 1.5k.
- 21 clips con **Seedance 2.0 Mini** a 720p, cada uno desde su fotograma, con audio
  ambiente propio y sin diálogo.
- Música de fondo con **ElevenLabs Music v2** (desde Magnific), 128 s, instrumental.

Por tratarse de un caso real con víctimas: el avión aparece sin logos de aerolínea,
la tripulación solo en silueta y no se muestra el impacto.

Cifras en pantalla cuando la voz las dice: 8 DE MARZO DE 2014 · 00:41, 239 A BORDO,
01:19, «BUENAS NOCHES, MALAYSIAN 370», TRANSPONDEDOR: OFF, GIRO DE 180°,
7 HORAS EN SILENCIO, 08:19, 120.000 KM², y el título VUELO MH370 al final.

## Estructura

```
guion/planos.md           los 21 planos: cuándo entra cada uno, qué muestra, qué cifra sale
build/palabras.json       tiempo de cada palabra (faster-whisper, corregido) → subtítulos
build/hacer_spec.py       línea de tiempo, gancho, cifras, título y tarjeta final
build/montar.py           el montaje completo (ffmpeg + libass)
manifiesto/               ids de cada generación en Magnific y desglose de créditos
```

## Volver a montar

```bash
python3 hacer_spec.py urls.tsv > spec.json     # urls.tsv: id<TAB>url de cada clip + MUS
python3 montar.py spec.json palabras.json salida.mp4
```

## Copy sugerido

`239 personas, 7 horas en silencio y un avión que nunca apareció. ¿Accidente o algo deliberado? ✈️🌊 #mh370 #misterio #aviacion #vuelo370 #curiosidades #historia`
