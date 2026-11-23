#!/bin/bash
# Instala el panel "Multicam Sync" en Premiere Pro (Mac). No pide contraseña.
AQUI="$(cd "$(dirname "$0")" && pwd)"
ORIGEN="$AQUI/MulticamSync"
DESTINO="$HOME/Library/Application Support/Adobe/CEP/extensions/MulticamSync"

if [ ! -f "$ORIGEN/CSXS/manifest.xml" ]; then
  osascript -e 'display dialog "No encuentro la carpeta MulticamSync junto a este instalador." buttons {"OK"} with title "Multicam Sync"' >/dev/null
  exit 1
fi

mkdir -p "$HOME/Library/Application Support/Adobe/CEP/extensions"
if [ -d "$DESTINO" ]; then rm -rf "$DESTINO"; fi
cp -R "$ORIGEN" "$DESTINO"
xattr -dr com.apple.quarantine "$DESTINO" 2>/dev/null

# Permitir paneles sin firma digital (solo para tu usuario)
for v in 9 10 11 12 13 14 15; do
  defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1
done

osascript -e 'display dialog "Multicam Sync instalado.\n\n1. Cierra y vuelve a abrir Premiere Pro.\n2. Menú Ventana > Extensiones > Multicam Sync." buttons {"OK"} with title "Multicam Sync"' >/dev/null
echo "Instalado en: $DESTINO"
