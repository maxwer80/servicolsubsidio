# El Dorado · Parte 1: el hombre dorado que nunca apareció

**Video final:** https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/6b3f9be7-e8be-4fa3-a0e1-27d7cd1dd675.mp4

**3:04 · 9:16 · 720×1280 · 30 fps · H.264 + AAC · −13,9 LUFS · logo de la marca arriba a la derecha.**
Termina pidiendo "PARTE 2" en los comentarios.

Voz: **El Faraon** (ElevenLabs `eleven_v4`, una toma, `audio/faraon_v4.mp3`). Todo lo visual se hizo en **Magnific**:

| Parte | Modelo | Créditos |
|---|---|---|
| 61 imágenes (58 planos + 3 referencias: cacique muisca, Quesada, Raleigh) | Nano Banana Pro, 9:16 | 4.575 |
| 13 planos clave con sonido nativo | **Seedance 2.5, 720p** | 25.520 |
| 45 planos con sonido nativo | **Kling 3.0, 720p** | ≈ 17.745 |
| Música 185 s instrumental (ocarina, flauta, tambores, vihuela, cuerdas) | ElevenLabs Music v2 | 3.700 |
| **Total** (saldo de la cuenta: 217.921 → 166.381) | | **51.540** |

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
−13,9 LUFS integrados; 184,0 s; 720×1280; respiros entre −19 y −26 LUFS; sin imágenes congeladas.
