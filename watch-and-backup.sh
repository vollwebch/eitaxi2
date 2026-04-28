#!/bin/bash
# Vigila cambios y hace backup cada 3 minutos
# Se ejecuta en segundo plano

while true; do
    cd /home/z/eitaxi-restored || exit 1
    
    # Git commit + push si hay cambios
    git add -A 2>/dev/null
    CHANGES=$(git diff --cached --stat 2>/dev/null)
    if [ -n "$CHANGES" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        git commit -m "auto-backup $TIMESTAMP" --allow-empty --quiet 2>/dev/null
        git push origin main --quiet 2>&1
        echo "[$(date)] Cambios guardados en GitHub"
    fi
    
    # Backup local comprimido
    mkdir -p /home/z/my-project/download
    tar -czf /home/z/my-project/download/eitaxi-latest.tar.gz \
      --exclude='node_modules' \
      --exclude='.next' \
      --exclude='.git' \
      --exclude='*.tar.gz' \
      --exclude='*.db' \
      src/ prisma/ messages/ public/ \
      next.config.ts tailwind.config.ts postcss.config.mjs tsconfig.json \
      package.json package-lock.json components.json .env \
      auto-*.sh start-*.sh keep-*.sh run-server.js forever-server.js \
      2>/dev/null
    
    sleep 60  # 3 minutos
done
