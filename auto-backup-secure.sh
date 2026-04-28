#!/bin/bash
# Backup avanzado - Protege contra reinicios del servidor
# Se ejecuta cada 5 minutos vía cron

PROJECT_DIR="/home/z/eitaxi-restored"
BACKUP_DIR="/home/z/my-project/download"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cd "$PROJECT_DIR" || exit 1

# 1. Git add + commit (solo si hay cambios)
git add -A
CHANGES=$(git diff --cached --stat 2>/dev/null)
if [ -n "$CHANGES" ]; then
    git commit -m "auto-backup $TIMESTAMP" --allow-empty --quiet
    # 2. Push a GitHub (fuera del servidor = seguro)
    git push origin main --quiet 2>&1
fi

# 3. Backup local comprimido (excluye node_modules y .next)
tar -czf "$BACKUP_DIR/eitaxi-latest.tar.gz" \
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

echo "[$(date)] Backup completado OK"
