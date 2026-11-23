# Multicam Sync — panel para Premiere Pro (Mac)

Sincroniza cámaras por audio y arma la secuencia multicámara dentro de Premiere.
No necesita Python, Homebrew ni contraseña de administrador.

## Instalar (una sola vez)
1. Deja juntos `Instalar en Premiere.command` y la carpeta `MulticamSync`.
2. Doble clic en **Instalar en Premiere.command** (si macOS lo bloquea: clic derecho > Abrir > Abrir).
3. Cierra y vuelve a abrir Premiere Pro.
4. Menú **Ventana > Extensiones > Multicam Sync**.

## Usar
1. En el panel Proyecto selecciona los clips de las cámaras (Cmd + clic).
2. En el panel, pulsa **Usar clips seleccionados en el Proyecto**.
3. Marca la cámara maestra (la de mejor audio), pon el nombre y la duración mínima de plano (2 s por defecto).
4. Pulsa **Sincronizar y crear secuencia**. Se crea la secuencia con el ponche por voz:
   en cada momento queda activa la cámara de quien habla.

## Cambiar lo que no te guste
- Pon el cabezal en el tramo y pulsa **Cámara 1 / 2 / 3** en el panel.
- Para un corte nuevo: pon el cabezal donde quieres cortar, pulsa **Cortar aquí** y elige la cámara.
- Todas las cámaras siguen en la secuencia (las apagadas se ven grises), así que nada se pierde.

El audio se lee con `afconvert`, que viene con macOS (.mov, .mp4, .m4a, .wav, .aif).
Para .MXF o .MTS hace falta ffmpeg instalado en `/opt/homebrew/bin` o `/usr/local/bin`.
