# Los tres fareros de las Islas Flannan (1900)

**Video final:** https://d2ol7oe51mr4n9.cloudfront.net/user_3F3sHT74ajkFDR1aNGJycFEgP61/cfb93650-9e59-4fb6-84fb-b21317202100.mp4

**2:53 · 9:16 · 1080×1920 · 30 fps · H.264 + AAC · −13,8 LUFS · logo de la marca arriba a la derecha.**
Cierre sin "parte 2": termina con "¿Qué pasó en Flannan? Te leo en los comentarios".

Todo se generó en **Magnific**, con **Kling 2.5 en 1080p** para los 48 clips:

| Parte | Modelo | Créditos |
|---|---|---|
| 50 imágenes (48 planos + 2 referencias: los tres fareros y el faro) | Nano Banana Pro, 9:16 | 3.750 |
| 48 clips (44 de 5 s + 4 de 10 s) | **Kling 2.5, 1080p** | 16.900 |
| Música 175 s, instrumental (drones, violín celta, piano) | ElevenLabs Music v2 | 3.500 |
| Ambiente exterior e interior + 4 efectos (sirena y bengala, ola, reloj, puerta) | ElevenLabs SFX | 390 |
| **Total** (según el saldo de la cuenta: 243.111 → 217.921) | | **≈ 25.190** |

El modo ilimitado del plan no aplica a las generaciones hechas por el conector, así que se cobraron créditos.

## Cómo está armado
- `build/plan.py`: cortes de los 48 planos sobre la voz y 4 respiros (tras "…qué ocurrió", "Silencio", "…mangas de camisa" y "…esa costa").
- `build/planos.py` → `planos.json`: prompt de imagen y de movimiento de cada plano; las referencias mantienen iguales a los fareros y al faro en todo el video.
- `build/palabras.json`: la voz transcrita palabra por palabra, con nombres corregidos (Eilean Mòr, Hesperus, Flannan).
- `build/hacer_spec.py`: rótulos (EILEAN MÒR · ESCOCIA, 15 DIC 1900 · FARO APAGADO, 2 DE 3 IMPERMEABLES, +30 M SOBRE EL MAR…), gancho, título, cierre, tramos de ambiente interior y efectos.
- `build/montar.py`: igual que en los videos anteriores, pero a 1080×1920 y con `construir_ambiente`: como Kling 2.5 no genera sonido, arma una cama de ambiente (viento y mar afuera, casa del faro adentro) y mete los efectos en su momento.
- `manifiesto/generaciones.md`: la imagen y el clip de cada plano.

## Medidas del render final
−13,8 LUFS integrados; 173,0 s; 1080×1920; respiros entre −19 y −25 LUFS; sin imágenes congeladas; los 48 planos revisados en hoja de contactos (todos derechos).
