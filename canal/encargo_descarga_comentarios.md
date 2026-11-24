# Encargo: descarga de comentarios de YouTube para investigación de mercado

## Objetivo
Descargar los **comentarios públicos** de los 18 videos de YouTube listados abajo y entregarlos en **un solo archivo CSV**. Los datos son para un análisis de contenido (escucha social) sobre lo que dice, pide y critica el público hispanohablante que aprende a crear videos y publicidad con inteligencia artificial.

## Qué descargar
- **Videos de la competencia (1–12):** hasta **500 comentarios principales por video**, ordenados por **"Más relevantes" (top)**. Incluye también sus respuestas, hasta 20 por comentario.
- **Videos del canal propio (13–18):** **todos** los comentarios y sus respuestas.
- Solo comentarios **públicos**. No hace falta iniciar sesión con ninguna cuenta personal.

| # | grupo | canal | tema | url |
|---|---|---|---|---|
| 1 | competencia | Scalboost | Comerciales de agencia con IA | https://www.youtube.com/watch?v=ldhp1WwVM2s |
| 2 | competencia | Scalboost | Comerciales consistentes con IA | https://www.youtube.com/watch?v=cYC_LVan4TA |
| 3 | competencia | Adrián Sáenz | Millonarios con Higgsfield | https://www.youtube.com/watch?v=fJzUnSEnKNs |
| 4 | competencia | Adrián Sáenz | Ganar dinero con Claude | https://www.youtube.com/watch?v=Or8neoE7Z4c |
| 5 | competencia | No es X es Y | Influencer con IA paso a paso | https://www.youtube.com/watch?v=U9K18ikCQvY |
| 6 | competencia | Lorena Bordonaba | Creé un influencer IA | https://www.youtube.com/watch?v=mGHGYPjb61s |
| 7 | competencia | Metics Media | Higgsfield guía completa | https://www.youtube.com/watch?v=vUr95tjMedQ |
| 8 | competencia | Laura Blago | Anuncios con IA que venden | https://www.youtube.com/watch?v=MTKzhzw-JmE |
| 9 | competencia | Camilo Barbosa | Anuncios con IA que venden | https://www.youtube.com/watch?v=pNQCnkzCULk |
| 10 | competencia | Álvaro Pareja | Apps de IA para marketing | https://www.youtube.com/watch?v=-nuDDAjUmy4 |
| 11 | competencia | Tutoriales Informáticos + IA | Seedance 2.5 | https://www.youtube.com/watch?v=8rGycvMVbBg |
| 12 | competencia | Affiliation | Videos ultra realistas con Seedance | https://www.youtube.com/watch?v=oH8Tdk8p1bQ |
| 13 | propio | John Balcázar | After Effects en vivo | https://www.youtube.com/watch?v=dsR0c-g-AaE |
| 14 | propio | John Balcázar | Premiere a ritmo de música | https://www.youtube.com/watch?v=sJ7kmkisGNU |
| 15 | propio | John Balcázar | Curso Photoshop | https://www.youtube.com/watch?v=9WggOn_hRDE |
| 16 | propio | John Balcázar | Short "apareció ella" | https://www.youtube.com/shorts/bToOvn9cGlg |
| 17 | propio | John Balcázar | Comerciales con Seedance | https://www.youtube.com/watch?v=-x4-DQftbGw |
| 18 | propio | John Balcázar | Influencer con IA | https://www.youtube.com/watch?v=i661BMXFHRI |

## Formato de entrega
Un archivo llamado **`comentarios.csv`**, codificado en **UTF-8** y separado por comas, con estas columnas en este orden:

| columna | descripción | ejemplo |
|---|---|---|
| `video_id` | ID del video (lo que va después de `v=` o `/shorts/`) | ldhp1WwVM2s |
| `grupo` | `competencia` o `propio` (tomado de la tabla) | competencia |
| `canal` | nombre del canal (tomado de la tabla) | Scalboost |
| `comentario_id` | ID del comentario en YouTube | Ugz… |
| `respuesta_a` | `comentario_id` del comentario padre si es una respuesta; vacío si no lo es | |
| `texto` | texto completo del comentario, sin recortar | No me sale la misma cara en cada escena… |
| `likes` | número de "me gusta" | 34 |
| `fecha` | fecha de publicación (AAAA-MM-DD) | 2026-10-02 |
| `autor_anonimo` | **NO el nombre real**: un número consecutivo por autor (A001, A002…), el mismo número si el autor se repite | A017 |
| `es_creador` | `si` cuando el comentario lo escribe el dueño del canal | no |

**Privacidad:** no incluir nombres de usuario, fotos ni enlaces a perfiles. Los datos se usan de forma agregada y anónima.

## Además, entregar un resumen breve
Un archivo `resumen_descarga.txt` que indique:
- cuántos comentarios se descargaron por video,
- qué videos fallaron o tenían los comentarios desactivados,
- la herramienta y la fecha de la descarga.

## Herramientas sugeridas (cualquiera sirve)
1. **YouTube Data API v3** (oficial y gratis dentro de la cuota): endpoints `commentThreads.list` (con `order=relevance`) y `comments.list` para las respuestas.
2. **Apify – YouTube Comments Scraper**: sin programar, exporta a CSV.
3. **ExportComments.com**: sin programar.
4. **youtube-comment-downloader**: librería de Python de código abierto, con `sort_by=SORT_BY_POPULAR`.

## Lo que NO hay que hacer
- No hacer análisis ni resúmenes del contenido: solo la descarga limpia. El análisis se hace después.
- No traducir ni corregir la ortografía de los comentarios: se necesita el **texto original**, porque el lenguaje exacto del público es parte de la investigación.
- No eliminar los comentarios cortos o con emojis.

## Cuando esté listo
Subir `comentarios.csv` y `resumen_descarga.txt` a la carpeta `canal/datos/` del repositorio `servicolsubsidio`.
