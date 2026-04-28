#!/bin/bash
# Auto-backup script: Creates a backup and pushes to GitHub
# Run this after any change: bash auto-backup.sh "description of changes"

BACKUP_DIR="/home/z/eitaxi-restored"
COMMIT_MSG="${1:-Auto backup $(date +%Y-%m-%d\ %H:%M)}"

cd "$BACKUP_DIR"

# Create backup file (lightweight - no node_modules/.next)
echo "Creating backup..."
tar -czf "/home/z/eitaxi-restored/public/backups/latest-backup.tar.gz" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='public/backups/*.tar.gz' \
  src/ prisma/ messages/ public/ \
  next.config.ts tailwind.config.ts postcss.config.mjs tsconfig.json \
  package.json package-lock.json 2>/dev/null

# Add and commit all changes to git
git add -A
git commit -m "$COMMIT_MSG" --allow-empty

# Push to GitHub
git push origin main 2>&1

echo "✅ Backup pushed to GitHub: $COMMIT_MSG"
echo "📦 Local backup: /home/z/eitaxi-restored/public/backups/latest-backup.tar.gz"
