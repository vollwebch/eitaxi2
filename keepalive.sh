#!/bin/bash
# EiTaxi Keepalive & Auto-Recovery Script
# Runs every 2 minutes via cron

LOG="/home/z/my-project/keepalive.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Keepalive check..." >> "$LOG"

# Check if PM2 process exists and is running
PM2_STATUS=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')

if [ "$PM2_STATUS" != "online" ]; then
    echo "[$DATE] ⚠️  Server NOT online (status: ${PM2_STATUS:-NOT FOUND}). Restarting..." >> "$LOG"
    cd /home/z/my-project
    
    # Try to restart with PM2
    pm2 restart eitaxi 2>/dev/null
    sleep 5
    
    # Check if it came back
    NEW_STATUS=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')
    if [ "$NEW_STATUS" = "online" ]; then
        echo "[$DATE] ✅ Restart successful!" >> "$LOG"
    else
        echo "[$DATE] 🔴 PM2 restart failed. Full rebuild..." >> "$LOG"
        pm2 delete eitaxi 2>/dev/null
        pm2 start ecosystem.config.cjs
        pm2 save
        sleep 5
        
        FINAL_STATUS=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')
        if [ "$FINAL_STATUS" = "online" ]; then
            echo "[$DATE] ✅ Full rebuild + restart successful!" >> "$LOG"
        else
            echo "[$DATE] 💀 CRITICAL: Could not recover. Manual intervention needed!" >> "$LOG"
            # Try a complete rebuild as last resort
            cd /home/z/my-project
            npm run build 2>> "$LOG"
            pm2 delete eitaxi 2>/dev/null
            pm2 start ecosystem.config.cjs
            pm2 save
        fi
    fi
else
    # Server is online - do a quick HTTP health check
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3000/ 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
        echo "[$DATE] ✅ All good (HTTP $HTTP_CODE, PM2 $PM2_STATUS)" >> "$LOG"
    else
        echo "[$DATE] ⚠️  PM2 online but HTTP check returned $HTTP_CODE. Restarting..." >> "$LOG"
        pm2 restart eitaxi
        pm2 save
    fi
fi

# Clean old logs (keep last 500 lines)
if [ -f "$LOG" ]; then
    if [ $(wc -l < "$LOG") -gt 500 ]; then
        tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
    fi
fi
