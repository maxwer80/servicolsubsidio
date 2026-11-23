# Multicam sincronizado por audio para Premiere Pro (Mac)

## Archivos (deben estar juntos en la misma carpeta)
- `Sincronizar Multicam.command` — paso 1, doble clic
- `sincronizar_audio.py` — lo usa el paso 1
- `multicam.jsx` — paso 2, se ejecuta en Premiere

## Paso 1 — Sincronizar por audio
1. Pon todos los videos de las cámaras en una misma carpeta (puede incluir el audio de una grabadora aparte: .wav, .m4a).
2. Doble clic en **Sincronizar Multicam.command**.
   - Si macOS dice que no puede abrirlo: clic derecho > Abrir > Abrir.
   - Si dice que no tiene permisos, en Terminal: `chmod +x "Sincronizar Multicam.command"`.
   - La primera vez instala numpy (necesita internet, solo una vez).
3. Elige la carpeta de los videos y la cámara **maestra** (la de mejor audio).
4. Se crea `multicam_sync.json` dentro de la carpeta de los videos.

Para .MXF o .MTS instala ffmpeg: `brew install ffmpeg`.

## Paso 2 — Armar en Premiere
1. Abre tu proyecto en Premiere Pro.
2. En VS Code (con la extensión **ExtendScript Debugger** de Adobe) abre `multicam.jsx`, elige **Adobe Premiere Pro** como destino y ejecútalo.
3. Elige el `multicam_sync.json`, el nombre de la secuencia y los segundos por plano (0 = sin cortes automáticos).

Para cambiar de cámara en vivo: selecciona todo en la secuencia > Anidar > clic derecho > Multicámara > Habilitar.
