# LA LLORONA DEL GUAYURIBA

Serie de terror folclórico colombiano para TikTok / Reels / Shorts.
**3 capítulos · 60 s exactos cada uno · 9:16 · 720p · español (Colombia).**

## Los capítulos

| # | Título | Gancho (0–3 s) | Descarga |
|---|---|---|---|
| 1 | La regla del llanto | "Si la oyes lejos… está detrás de ti." | [cap1.mp4](https://d2ol7oe51mr4n9.cloudfront.net/user_2wBAVh21Eg9QKYBQloVcNxmFKPJ/3f889669-6801-401f-a574-ed62e371e71a.mp4) |
| 2 | El bulto | "Me desperté con el río en la cama." | [cap2.mp4](https://d2ol7oe51mr4n9.cloudfront.net/user_2wBAVh21Eg9QKYBQloVcNxmFKPJ/46b79713-d645-49dd-820d-a5fa39683873.mp4) |
| 3 | El nombre | "Para que te suelte, di el nombre de la niña." | [cap3.mp4](https://d2ol7oe51mr4n9.cloudfront.net/user_2wBAVh21Eg9QKYBQloVcNxmFKPJ/aad8cecc-f868-4ba3-9ed6-2361dbb2ec81.mp4) |

Cada archivo va listo para subir: 720×1280, H.264 + AAC, 24 fps, audio normalizado
a −14 LUFS (el objetivo de TikTok), subtítulos quemados y tarjeta de cierre.

## Cómo se mantiene la consistencia

**Personajes.** Se generaron primero cuatro láminas de referencia (Samu, La Llorona,
la abuela Rosalba y la locación/grade). Los 18 fotogramas clave se generaron con
`gpt_image_2_5` pasando esas láminas como `image_references`, y cada clip de video
nace de su fotograma como `start_image`. Todos los planos descienden del mismo
material, así que la cara, la cicatriz, la camisa de cuadros y el vestido empapado
no cambian entre capítulos.

**Voces.** Tres `voice_id` fijos de `seed_audio`, los mismos en los tres capítulos
(ver `guion/00_biblia.md`). Los clips se generaron con la instrucción explícita de
no producir diálogo, así que el audio nativo sólo aporta ambiente (río, moto,
lluvia, llantos) y encima va la voz en off, que se agacha el ambiente sola con un
compresor de cadena lateral.

## Estructura de la carpeta

```
guion/        biblia de serie y los tres guiones plano por plano
build/        montar.py (el montaje completo) y los spec.json de cada capítulo
manifiesto/   ids de cada generación (referencias, fotogramas, clips, voces)
```

## Volver a montar o retocar

`build/montar.py` corre en el sandbox de Higgsfield (`sandbox_exec`), que sí alcanza
el CDN donde viven los clips:

```bash
python3 montar.py spec.json /home/user/out
```

Todo lo editable está en los `spec.json`: los tiempos de entrada de cada línea, el
texto de los subtítulos, el gancho de arriba, la tarjeta de cierre y el orden de los
planos. Cambiar una voz es cambiar un `voice_id` en la biblia y regenerar esa línea.

## Copy sugerido para publicar

- **Cap. 1** — `En Colombia hay una regla con La Llorona… y yo me la salté. 1/3 #lallorona #leyendascolombianas #terror #miedo #llanos`
- **Cap. 2** — `Desperté con el río en la cama. El bulto seguía ahí. 2/3 #lallorona #leyendascolombianas #terror #historiasdeterror`
- **Cap. 3** — `Solo se rompe con un nombre. 3/3 — ¿hacemos capítulo 4? #lallorona #leyendascolombianas #terror #finalinesperado`

Publicar los tres el mismo día con 3–4 horas entre cada uno; el cap. 3 cierra con
pregunta abierta para que la gente comente.

## Costo

211,5 créditos de Higgsfield en total (el tope acordado era 600):
18 clips de 10 s con `seedance_2_0_mini` a 720p = 180, 22 fotogramas e imágenes de
referencia = 23, 23 líneas de voz = 8,5. El montaje, los subtítulos y las tarjetas
se hicieron con ffmpeg, sin costo.
