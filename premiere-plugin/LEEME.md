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
3. Marca la cámara maestra (la de mejor audio), pon el nombre y, si quieres, los segundos por plano.
4. Pulsa **Sincronizar y crear secuencia**.

El audio se lee con `afconvert`, que viene con macOS (.mov, .mp4, .m4a, .wav, .aif).
Para .MXF o .MTS hace falta ffmpeg instalado en `/opt/homebrew/bin` o `/usr/local/bin`.
