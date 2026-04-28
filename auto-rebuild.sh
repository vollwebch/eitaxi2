#!/bin/bash
# Auto-rebuild script: Rebuild and restart if source code changes
# Intended to run every 5 minutes to catch any file changes

LOG="/home/z/my-project/auto-rebuild.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

cd /home/z/my-project

# Check if there are uncommitted changes (from manual edits, etc.)
CHANGES=$(git status --porcelain 2>/dev/null | grep -v '^\?\?' | wc -l)

if [ "$CHANGES" -gt 0 ]; then
    echo "[$DATE] 📝 Detected $CHANGES file changes. Rebuilding..." >> "$LOG"
    
    # Rebuild
    npm run build >> "$LOG" 2>&1
    
    if [ $? -eq 0 ]; then
        # Restart with new build
        pm2 restart eitaxi
        pm2 save
        echo "[$DATE] ✅ Rebuild and restart successful" >> "$LOG"
        
        # Auto-commit and push changes
        git add -A
        git commit -m "auto-rebuild: $CHANGES files changed" >> "$LOG" 2>&1
        git push origin main >> "$LOG" 2>&1
        echo "[$DATE] 📤 Changes pushed to GitHub" >> "$LOG"
    else
        echo "[$DATE] 🔴 Build failed! Keeping old version running." >> "$LOG"
    fi
else
    echo "[$DATE] ✅ No changes detected. Current build is up to date." >> "$LOG"
fi

# Clean old logs
if [ -f "$LOG" ] && [ $(wc -l < "$LOG") -gt 500 ]; then
    tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
