# EL SUBMARINO MINERVE

Video vertical de misterio para TikTok / Reels / Shorts sobre la voz en off original
(`SUBMARINO.mp3`, 111,7 s).
**115 s · 9:16 · 720×1280 · 30 fps · H.264 + AAC · audio normalizado a −14 LUFS.**

Mismas condiciones que `bermudas/` y `mh370/`: tope de 35.000 créditos (gasto real 21.375),
todo lo visual en **Magnific**:

- 21 fotogramas con **Seedream 5 Pro** a 1.5k.
- 21 clips con **Seedance 2.0 Mini** a 720p, cada uno desde su fotograma, con audio
  ambiente propio y sin diálogo.
- Música de fondo con **ElevenLabs Music v2** (desde Magnific), 115 s, instrumental.

Caso real con víctimas: tripulación y familias en silueta o sin rasgos, sin rostro para el
comandante ni para Cousteau, y la implosión se muestra sin personas.

Cifras en pantalla cuando la voz las dice: A SOLO 45 KM DE SU BASE, 07:55, 52 TRIPULANTES,
27 ENE 1968 · TOLÓN, EL MINERVE, SIN SEÑAL, 07:59, 51 AÑOS DESPUÉS, JULIO 2019,
2.370 M DE PROFUNDIDAD.

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

`52 tripulantes, 4 minutos y medio siglo de silencio. ¿Qué te da más miedo: el espacio o el océano? 🌊⚓ #submarino #minerve #misterio #oceano #historia #curiosidades`
