# LA LLORONA DEL GUAYURIBA — Biblia de serie

Serie vertical de terror folclórico colombiano para TikTok / Reels / Shorts.
3 capítulos · 60 s cada uno · 9:16 · 720p · español (Colombia).

## Premisa

En los Llanos Orientales, a orillas del río Guayuriba, La Llorona no solo llora:
cobra deudas de familia. Samuel "Samu" Rangel, mototaxista de 24 años, recibe en
plena madrugada un bulto que no le pertenece… y descubre que la deuda es de su
sangre.

## Regla del mito (el gancho conceptual de la serie)

> "Si la oyes lejos, está detrás de ti. Si la oyes cerquita, todavía tienes tiempo."

Es la variante colombiana real de la leyenda (el llanto se percibe invertido en la
distancia). Toda la serie se construye sobre esa regla: es lo que se dice en los
primeros 2 segundos del capítulo 1 y lo que hace que el espectador se quede.

## Personajes (consistencia bloqueada por imagen de referencia)

| Personaje | Descripción física fija | Ref. de imagen |
|---|---|---|
| **Samuel "Samu" Rangel**, 24 | Llanero mestizo, piel morena clara, pelo negro corto, bigote fino, cicatriz vertical en la ceja derecha, camisa de cuadros rojo y negro abierta sobre camiseta blanca, jean oscuro, botas cafés gastadas, pañoleta roja en la muñeca izquierda. Moto enduro roja vieja. | `assets/ref_samu` |
| **La Llorona** | Mujer ahogada, ~30. Vestido de lino blanco empapado hasta los tobillos, pelo negro larguísimo mojado sobre la cara, piel gris azulada, cuencas oscuras sin pupila, pies descalzos embarrados, carga un bulto de trapo café sucio. | `assets/ref_llorona` |
| **Abuela Rosalba**, 72 | Cara curtida y surcada, moño plateado bajo, aretes de oro pequeños, delantal floreado desteñido sobre blusa beige, rosario de madera en las manos. | `assets/ref_abuela` |
| **Locación / grade** | Carretera destapada de tierra roja junto al río Guayuriba, 2 a.m., niebla baja, palmas de galería, grade teal-ámbar, 35 mm anamórfico, grano de película. | `assets/ref_locacion` |

## Voces (fijas en los 3 capítulos)

| Rol | Modelo | Voz | voice_id |
|---|---|---|---|
| Narrador / Samu | `seed_audio` | Miles (m) | `e18664a7-ee4f-5273-acf8-533eb24cd366` |
| Abuela Rosalba | `seed_audio` | Petra (f) | `0c63637d-2ecb-5bda-9bbe-38894aa9a876` |
| La Llorona | `seed_audio` | Onyx (f) + reverb/pitch −15 % | `8911390e-4b59-459b-ba84-19010917e1df` |

Cambiar de voz = cambiar un solo `voice_id` y re-renderizar; nada más se toca.

## Estructura de cada capítulo

6 planos × 10 s = 60 s exactos.

- **0–3 s · gancho**: una frase que plantea una regla o una amenaza concreta.
- **3–45 s · escalada**: un detalle nuevo e incómodo por plano (el agua dentro del
  casco, el barro en la cama, la manito fría).
- **45–55 s · golpe**: el susto o la revelación.
- **55–60 s · cliffhanger + tarjeta**: texto en pantalla que nombra el capítulo
  siguiente. El capítulo 3 cierra con pregunta abierta para comentarios.

## Ganchos por capítulo

1. **Cap. 1 — "La regla del llanto"**: "Si la oyes lejos… es porque está detrás de ti."
2. **Cap. 2 — "El bulto"**: "Desperté con el río en la cama."
3. **Cap. 3 — "El nombre"**: "Para que te suelte, tienes que decir el nombre de la niña."
