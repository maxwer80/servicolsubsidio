#!/bin/bash
# ---------------------------------------------------------------------------
#  PASO 1 de 2 — Sincronizar cámaras por AUDIO (Mac)
#  Doble clic en este archivo. Elige la carpeta con los videos de las cámaras
#  y la cámara maestra. Se crea "multicam_sync.json" en esa carpeta.
#  PASO 2: en Premiere ejecuta multicam.jsx y elige ese archivo.
# ---------------------------------------------------------------------------
AQUI="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$AQUI/sincronizar_audio.py"
VENV="$HOME/.multicam_sync_venv"

aviso() { osascript -e "display dialog \"$1\" buttons {\"OK\"} default button 1 with title \"Multicam\"" >/dev/null 2>&1; }

if [ ! -f "$SCRIPT" ]; then
  aviso "No encuentro sincronizar_audio.py. Debe estar en la misma carpeta que este archivo."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1 || ! python3 -c "import sys" >/dev/null 2>&1; then
  aviso "Falta Python 3. Instálalo desde python.org o con: xcode-select --install"
  exit 1
fi

# Entorno propio con numpy (solo la primera vez, necesita internet)
if ! "$VENV/bin/python" -c "import numpy" >/dev/null 2>&1; then
  echo "Primera ejecución: instalando numpy (solo se hace una vez)..."
  python3 -m venv "$VENV" && "$VENV/bin/python" -m pip install --quiet --upgrade pip numpy
  if ! "$VENV/bin/python" -c "import numpy" >/dev/null 2>&1; then
    aviso "No se pudo instalar numpy. Revisa tu conexión a internet."
    exit 1
  fi
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Nota: ffmpeg no está instalado; se usará afconvert de macOS (sirve para .mov/.mp4/.wav)."
  echo "      Para .MXF/.MTS instala ffmpeg con:  brew install ffmpeg"
fi

CARPETA=$(osascript -e 'POSIX path of (choose folder with prompt "Elige la carpeta con los videos de las cámaras")' 2>/dev/null) || exit 0

LISTA=$("$VENV/bin/python" "$SCRIPT" "$CARPETA" --listar)
if [ "$(printf '%s\n' "$LISTA" | grep -c .)" -lt 2 ]; then
  aviso "En esa carpeta no hay al menos 2 videos."
  exit 1
fi

# Elegir la cámara maestra (la que tiene el mejor audio)
ITEMS=""
while IFS= read -r n; do
  n=${n//\\/\\\\}; n=${n//\"/\\\"}
  ITEMS="$ITEMS\"$n\","
done <<< "$LISTA"
ITEMS="{${ITEMS%,}}"
MAESTRA=$(osascript -e "set r to choose from list $ITEMS with prompt \"Elige la cámara MAESTRA (la de mejor audio):\" with title \"Multicam\"" -e 'if r is false then return ""' -e 'return item 1 of r' 2>/dev/null)
[ -z "$MAESTRA" ] && exit 0

echo ""
"$VENV/bin/python" "$SCRIPT" "$CARPETA" --maestra "$MAESTRA"
if [ $? -eq 0 ]; then
  aviso "Sincronización lista. Ahora en Premiere ejecuta multicam.jsx y elige el archivo multicam_sync.json de la carpeta de los videos."
else
  aviso "Hubo un problema. Revisa la ventana de Terminal."
fi
