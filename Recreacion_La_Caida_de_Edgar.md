# Recreación de La Caída de Edgar con IA

22 de octubre de 2026 · John Balcazar

Recrear desde el segundo 20 del video original (~23 s, formato 4:3) en Higgsfield, con el avatar John en el papel del chico de amarillo. Costo estimado: unos 450 créditos con Seedance 2.5.

## El video original

El archivo dura 42,8 s (636×480, ~4:3, 30 fps). Se usa desde el segundo 20 hasta el final: 22,8 s.

| Parte | Tiempo | Qué pasa |
| --- | --- | --- |
| Clip 1 | 0:20 – 0:31 | El de rojo (#83, con un palo) cruza el puente de troncos; el de amarillo/naranja agarra el tronco, lo sacude y el de rojo cae al arroyo. |
| Clip 2 | 0:31 – 0:43 | Cámara en mano desde arriba: el de rojo sale del agua mojado y camina hacia la cámara. |

**Personajes:**

- **Amarillo/naranja** (el que sacude el tronco) → se reemplaza por el avatar **John-personaje**, ya guardado como Element en Higgsfield.
- **Rojo** (el que cae) → igual en cuerpo, ropa (camiseta roja #83 con hombros blancos, bermuda cargo gris, tenis blancos), movimientos y caída. La cara será de un personaje inventado: es una persona real que era menor cuando se grabó.

## Plan de producción

1. **Cortar el video** desde el segundo 20 en 2 fragmentos (11 s y 12 s). *Hecho.*
2. **Subir los fragmentos a Higgsfield.** *Bloqueado: la red del entorno no permite `upload.higgsfield.ai`.*
3. **Crear el personaje rojo** (hoja de personaje con Nano Banana Pro) y guardarlo como Element.
4. **Prueba en 480p** de cada clip con Seedance 2.5 en modo edición de video: se cambian solo las personas (amarillo → John, rojo → personaje nuevo); se conservan escenario, tronco, agua y cámara.
5. **Aprobar la prueba** y generar la versión final en 1080p.
6. **Unir los 2 clips** en un solo MP4 de 4:3 y ~23 s.

## Seedance 2.5 vs Genjutsu

Recomendado: **Seedance 2.5 en modo edición de video**, porque cambia a las personas sobre el video original y deja todo lo demás igual.

| | Seedance 2.5 (edición de video) | Genjutsu |
| --- | --- | --- |
| Qué hace | Cambia solo a las personas del video original | Copia los movimientos del cuerpo y los aplica a personajes desde una imagen |
| Parecido a la escena | Muy alto: es el mismo video "repintado" | Movimientos idénticos; el escenario se arma con IA |
| Tronco, chapuzón, agua | Se mantienen | Tiene que inventarlos; ahí suele fallar |
| Formato 4:3 | Sale igual que el original | Sin opción 4:3; hay que reencuadrar |
| Calidad máxima | 1080p | 1080p |

Genjutsu conviene cuando solo importan los gestos o un baile, no una escena con objetos y agua.

## Costo estimado

Total aproximado: **450 créditos** de los 1.010 disponibles (plan Ultimate). Precios consultados en la cuenta el 22 de octubre de 2026.

| Concepto | Créditos |
| --- | --- |
| Hoja del personaje rojo (Nano Banana Pro, 2 por imagen) | ~8 |
| Prueba 480p, 2 clips | ~70 |
| Final 1080p, 2 clips de 11–12 s (192 por clip de 12 s) | ~370 |
| **Total** | **~450** |

El precio exacto de la edición de video se confirma al subir los fragmentos; cada repetición de un clip en 1080p cuesta unos 192 créditos. El costo de Genjutsu solo aparece después de subir el clip.

## Estado y pendientes

Todavía no se ha gastado ningún crédito: solo se consultaron precios.

- [x] Analizar el video y definir los 2 clips
- [x] Cortar los fragmentos desde el segundo 20
- [x] Comparar Seedance 2.5 y Genjutsu
- [ ] Habilitar `upload.higgsfield.ai` en el acceso a red del entorno ([instrucciones](https://code.claude.com/docs/en/cloud-environments#network-access))
- [ ] Subir los fragmentos y confirmar el precio exacto
- [ ] Decidir si se conserva el audio original (risas y gritos) o se genera nuevo
- [ ] Hacer la prueba en 480p y aprobarla
- [ ] Generar el final en 1080p y unir los clips
