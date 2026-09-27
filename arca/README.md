# EL ARCA DE NOÉ: LO QUE EL RADAR ENCONTRÓ BAJO LA TIERRA

Video vertical de misterio para TikTok / Reels / Shorts, hecho sobre la locución
original (`el_arca_de_noe.mp3`, 152 s) con **cinco respiros de ambiente**.
**166,5 s · 9:16 · 720×1280 · 30 fps · H.264 + AAC · −14 LUFS · logo de la marca
arriba a la derecha.** Dura menos de 3 minutos, así que entra como Short.

Esta vez todo se hizo en **Magnific** (tope pedido: 50.000 créditos):

| Parte | Modelo | Créditos |
|---|---|---|
| 39 fotogramas (36 + 3 rehechos) | Nano Banana Pro, 9:16 | 2.925 |
| 37 clips (36 + A30 rehecho en vertical), 169 s con sonido propio | **Seedance 2.0 Fast, 720p** | 39.715 |
| Música 168 s, instrumental | ElevenLabs Music v2 | 3.360 |
| 3 miniaturas | GPT 2 mini (medium) | 300 |
| **Total** | | **46.300** |

¿Por qué Seedance 2.0 Fast? Seedance 2.5 a 720p cuesta 440 créditos/s y Seedance
2.0 normal 280 créditos/s: con 164 s de video cualquiera de los dos se pasaba de
los 50.000. Seedance 2.0 Fast (235 créditos/s) es el mismo Seedance 2.0 a 720p,
con sonido nativo, y deja margen para repeticiones.

## Fotos reales recreadas

Las fotos que describe la historia se buscaron y se usaron como referencia:

- **La formación de Durupınar** (Wikimedia Commons, “The Structure Claimed to be
  the Noah's Ark near the Mount Ararat”): base de A02, A08, A09, A11, A14, A16,
  A24 y A35.
- **El letrero “Nuhun Gemisi 5” con el Ararat** (Wikimedia Commons,
  NuhunGemisi.jpg): A05 lo recrea casi igual, y A03 toma el mismo Ararat.
- La foto aérea de 1959 (A08) se recreó en blanco y negro a partir de la forma
  real de la formación.

## Estructura

```
GUION.md                  el guion y la versión para ElevenLabs
guion/planos.md           respiros y los 36 planos: cuándo entra cada uno y qué muestra
build/plan.py             cortes, pausas y la función mover() (voz original -> video)
build/planos.json         prompt de imagen y de movimiento/sonido de cada plano
build/palabras.json       tiempo de cada palabra en la voz original
build/hacer_spec.py       arma spec.json (textos en pantalla, fundidos)
build/montar.py           el montaje (el mismo de las pirámides y los mayas)
manifiesto/               identificadores de cada generación
```

## Qué lleva el montaje

- **Respiros:** la voz se abre 2–2,5 s después de “…algo que no debería estar
  ahí”, “¿Casualidad?”, “Pero en 2026, algo cambió”, “…madera petrificada” y
  “…para ver qué hay adentro”. En esos huecos sube el ambiente de los clips.
- Subtítulos palabra por palabra en amarillo; título “EL ARCA DE NOÉ”; datos en
  azul (MONTE ARARAT · TURQUÍA, OCTUBRE 1959 · OTAN, 157 METROS, 300 CODOS = 157 M,
  1960 · DINAMITA, 1977 · RON WYATT, RADAR · FUERZA AÉREA EE. UU., 90°, TÚNEL DE
  ~75 M, 6 M BAJO TIERRA, +40 % DE CARBONO, 18 METROS, ¿MADERA PETRIFICADA?, SIN
  CONFIRMAR); gancho “¿Y SI ESTUVO EN UN VALLE?” y cierre “¿ROCA O ARCA?”.
- Grade verde azulado / ámbar, grano, viñeta; mezcla con cada clip a −27 LUFS y
  música y ambiente que se agachan con la voz.

## Volver a montar

```bash
python3 hacer_spec.py urls.tsv > spec.json     # urls.tsv: A01..A36<TAB>url + MUS
python3 montar.py spec.json palabras.json salida.mp4
```

## Video final

https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/d2dea75f-2948-48d3-bca2-455f65a1cd2b.mp4

Medido en el render final: −14,2 LUFS integrados, 166,5 s, respiros entre −20,5 y −23 LUFS, sin fotogramas congelados. El plano A30 (científico) se rehízo porque había salido de lado.

## Miniaturas

https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/b052c112-a7d2-446f-8fdf-5e30d9577c2e.zip
(miniatura de YouTube 1280×720 “EL ARCA DE NOÉ · EL RADAR ENCONTRÓ ESTO”, portada
de Reel 1080×1920 “¿ROCA O ARCA?”, post de Facebook 1080×1350 “¿ENCONTRARON EL ARCA?”)

Copy para las redes: `../marca/DESCRIPCIONES_VIDEOS.md` (sección 8).
