# El Dorado · Parte 1: el hombre dorado que nunca apareció

**Video final:** https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/c38b255b-93fe-4687-9a9c-07dcdcc83a71.mp4

**3:02 · 9:16 · 720×1280 · 30 fps · H.264 + AAC · −13,9 LUFS · logo de la marca arriba a la derecha.**
Termina pidiendo "PARTE 2" en los comentarios.

Voz: **El Faraon** (ElevenLabs `eleven_v4`, una toma, `audio/faraon_v4.mp3`). Todo lo visual se hizo en **Magnific**:

| Parte | Modelo | Créditos |
|---|---|---|
| 61 imágenes (58 planos + 3 referencias: cacique muisca, Quesada, Raleigh) | Nano Banana Pro, 9:16 | 4.575 |
| 13 planos clave con sonido nativo | **Seedance 2.5, 720p** | 25.520 |
| 45 planos con sonido nativo | **Kling 3.0, 720p** | ≈ 17.745 |
| Música 185 s instrumental (ocarina, flauta, tambores, vihuela, cuerdas) | ElevenLabs Music v2 | 3.700 |
| Corrección v2: 7 planos que salían de lado (D01, D20, D21, D24, D28, D45, D50), imagen nueva + Kling 3.0 | Nano Banana Pro + Kling 3.0 | 3.360 |
| **Total** (saldo de la cuenta: 217.921 → 163.021) | | **54.900** |

El tope pedido era 60.000. Kling 2.5 no se usó.

## Fidelidad histórica
- Muiscas con mantas de algodón, narigueras y tunjos planos de oro; bohíos redondos de paja; laguna de Guatavita como cráter redondo.
- Conquistadores de los años 1530 con escaupil (armadura acolchada de algodón), capacete, espadas y ballestas.
- Federmann y su tropa vestidos con pieles en el páramo con frailejones; Belalcázar con caballería y cerdos desde Quito.
- Carlos V en 1528 (mandíbula Habsburgo, Toisón de Oro) y banqueros Welser de Augsburgo.
- Londres de 1618 para Raleigh; el hachazo nunca se muestra.

## Cómo está armado
- `build/plan.py`: respiros (tras "…de su época", "…forma de cobrar", "…en los tribunales" y "…su propia aldea") y duración.
- `build/planos.py` → `planos.json`: los 58 planos con modelo, prompt de imagen y de movimiento, y referencias de personaje.
- `build/palabras.json`: la voz transcrita palabra por palabra (faster-whisper), con Quesada, Federmann y "nuevo" corregidos.
- `build/hacer_spec.py`: rótulos (LONDRES · 1618, GUATAVITA · COLOMBIA, 1528 · CARLOS V, ≈ 1.800 ESMERALDAS, 3 EJÉRCITOS…), gancho "¿EXISTIÓ EL DORADO?", título y cierre.
- `build/montar.py`: el montaje de siempre, ahora a 720×1280 y con el sonido nativo de cada clip como ambiente.
- `build/imagenes.tsv`, `build/clips.tsv`: la imagen y el clip de cada plano.

## Medidas del render final
−13,9 LUFS integrados; 182,3 s; 720×1280; sin imágenes congeladas.

v2 (corrección): el respiro tras "…forma de cobrar" (1:21) pasó de 2,5 s a 0,8 s, porque sumado al silencio
natural de la voz dejaba más de 4 s casi mudos y se oía como un corte. Las subidas y bajadas de volumen de los
respiros ahora son rampas de 0,4 s. Entre 1:18 y 1:26 el audio ya no baja de −27 dB RMS en ventanas de 0,25 s.
v3: el corte de voz de 1:21 estaba en 79,7 s, justo cuando empieza "1536" (whisper lo ubicaba ~1 s tarde), y partía la palabra. Ahora los respiros se ponen dentro de silencios medidos en la voz (79,2 s y 153,5 s); transcribiendo el video final, "1536" sale entero.
Las 7 imágenes nuevas llevan en el prompt dónde va el cielo, dónde el suelo y hacia dónde apunta la cabeza de las personas.

---

# Parte 2 — Los que fueron a buscarlo

**Video final (3:10, 720×1280):** https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/62eab5a3-07f3-4c27-a04f-f1c4b57bb4e3.mp4

Guion: `GUION_PARTE2.md`, que va de la balsa muisca de Pasca (1969) a Pizarro y Orellana, Lope de Aguirre, Sepúlveda, Raleigh y Contractors Ltd, y cierra en el Museo del Oro.
Voz: El Faraón, eleven_v4, una sola toma (`audio/faraon_v4_parte2.mp3`, 183,4 s).

## Créditos Magnific (aproximados)
| Parte | Modelo | Créditos |
|---|---|---|
| 58 imágenes + 2 referencias de personaje (Pizarro, Aguirre) | Nano Banana Pro | ≈ 4.350 |
| 5 imágenes rehechas (E20, E21, E33 y E52 salían de lado; E30 bloqueada por filtro) | Nano Banana Pro | ≈ 450 |
| 14 planos clave | **Seedance 2.5, 720p**, sonido nativo | ≈ 27.700 |
| 44 planos | **Kling 3.0, 720p**, sonido nativo | ≈ 16.800 |
| Música 190 s instrumental | ElevenLabs Music v2 | ≈ 3.800 |
| **Total** | | **≈ 53.000** |

Por debajo del tope de 60.000. Kling 2.5 no se usó.

## Cómo está armado
`build2/`, con la misma estructura que `build/`: `plan.py` (respiros en 20,5 / 65,8 / 94,9 / 122,4 / 148,8 s, todos dentro de silencios medidos de la voz), `planos.py` → `planos.json`, `palabras.json`, `hacer_spec.py` (rótulos 1541 · GONZALO PIZARRO, 1561 · LOPE DE AGUIRRE, −20 METROS, 1618 · EJECUTADO, 1904 · CONTRACTORS LTD…), `montar.py`, `imagenes.tsv` y `clips.tsv`.

## Medidas del render final
−14,1 LUFS integrados; 190,5 s; 720×1280; sin imágenes congeladas. En la rejilla de fotogramas, los 58 planos salen derechos y sin teléfonos ni marcos.
Para evitar planos de lado, los prompts de imagen empiezan con "Tall vertical 9:16 composition, the top of the frame is up". Los planos rehechos usan "Upright portrait-format cinematic frame… No phones" (con "smartphone photo" aparecían teléfonos dentro de la imagen).
