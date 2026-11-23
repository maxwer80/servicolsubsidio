# Multicam Sync — panel para Premiere Pro (Mac)

Sincroniza cámaras por audio y arma la secuencia multicámara dentro de Premiere.
No necesita Python, Homebrew ni contraseña de administrador.

## Instalar (una sola vez)
1. Deja juntos `Instalar en Premiere.command` y la carpeta `MulticamSync`.
2. Doble clic en **Instalar en Premiere.command** (si macOS lo bloquea: clic derecho > Abrir > Abrir).
3. Cierra y vuelve a abrir Premiere Pro.
4. Menú **Ventana > Extensiones > Multicam Sync**.

## Usar
1. En el panel Proyecto selecciona los clips de las cámaras (y audios aparte si hay), con Cmd + clic.
2. **Usar clips seleccionados en el Proyecto**.
3. **Sincronizar e identificar hablantes**: sincroniza por audio, elige el audio más limpio
   y separa las voces (Voz A, Voz B…) aunque estén mezcladas en un solo canal mono.
   - Si el audio limpio elegido no es el correcto, cámbialo en "Audio limpio".
   - Si hablan 3 personas, pon 3 en "Personas que hablan" y pulsa "Identificar hablantes de nuevo".
4. Pulsa **▶** para escuchar cada voz y elige la cámara que muestra a esa persona.
5. Elige el plano general y pulsa **Crear secuencia ponchada**.
   Se escucha el audio limpio; las demás pistas quedan silenciadas.

## Cambiar lo que no te guste
- Pon el cabezal en el tramo y pulsa **Cámara 1 / 2 / 3** en el panel.
- Para un corte nuevo: pon el cabezal donde quieres cortar, pulsa **Cortar aquí** y elige la cámara.
- Todas las cámaras siguen en la secuencia (las apagadas se ven grises), así que nada se pierde.

El audio se lee con `afconvert`, que viene con macOS (.mov, .mp4, .m4a, .wav, .aif).
Para .MXF o .MTS hace falta ffmpeg instalado en `/opt/homebrew/bin` o `/usr/local/bin`.
