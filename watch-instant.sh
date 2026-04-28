#!/bin/bash
# Vigilante INSTANTÁNEO - detecta cambios cada 5 segundos
# y hace git push inmediatamente al detectar algo

PROJECT_DIR="/home/z/eitaxi-restored"
cd "$PROJECT_DIR" || exit 1

LAST_SUMMARY=""

while true; do
    # Obtener resumen de cambios actuales
    git add -A 2>/dev/null
    CURRENT_SUMMARY=$(git diff --cached --stat 2>/dev/null)
    
    if [ -n "$CURRENT_SUMMARY" ] && [ "$CURRENT_SUMMARY" != "$LAST_SUMMARY" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        git commit -m "auto-backup $TIMESTAMP" --allow-empty --quiet 2>/dev/null
        git push origin main --quiet 2>&1
        LAST_SUMMARY="$CURRENT_SUMMARY"
        echo "[$(date)] ✅ Cambios detectados y subidos a GitHub"
    fi
    
    sleep 5  # Comprobar cada 5 segundos
done
