#!/bin/bash
# EiTaxi Lightweight Watchdog
# Only acts when the server is truly down (not for HTTP hiccups)
# Runs every 60 seconds

WATCHDOG_LOG="/home/z/my-project/watchdog.log"
PARENT_PID=$$

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$WATCHDOG_LOG"
}

log "=== Watchdog Started (PID: $PARENT_PID) ==="

while true; do
    # Check if PM2 God daemon is alive
    if ! pgrep -f "PM2.*God Daemon" > /dev/null 2>&1; then
        log "⚠️  PM2 God Daemon not found. Starting PM2..."
        export PM2_HOME="/home/z/.pm2"
        cd /home/z/my-project
        pm2 start ecosystem.config.cjs
        pm2 save
        sleep 10
        continue
    fi

    # Check app status
    PM2_STATUS=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')
    
    if [ "$PM2_STATUS" != "online" ]; then
        log "⚠️  App status: ${PM2_STATUS:-NOT FOUND}. Recovering..."
        cd /home/z/my-project
        
        # Try restart
        pm2 restart eitaxi 2>/dev/null
        sleep 8
        
        NEW_STATUS=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')
        if [ "$NEW_STATUS" = "online" ]; then
            log "✅ Recovered via pm2 restart"
        else
            # Try full ecosystem reload
            log "⚠️  Restart failed. Reloading from ecosystem..."
            pm2 delete eitaxi 2>/dev/null
            pm2 start ecosystem.config.cjs
            pm2 save
            sleep 10
            
            FINAL=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')
            if [ "$FINAL" = "online" ]; then
                log "✅ Recovered via ecosystem reload"
            else
                log "💀 All attempts failed. Will retry in 60s."
            fi
        fi
    fi
    # If app is online, do nothing - PM2 handles its own restarts
    
    # Clean log
    if [ -f "$WATCHDOG_LOG" ] && [ $(wc -l < "$WATCHDOG_LOG") -gt 500 ]; then
        tail -100 "$WATCHDOG_LOG" > "${WATCHDOG_LOG}.tmp" && mv "${WATCHDOG_LOG}.tmp" "$WATCHDOG_LOG"
    fi
    
    sleep 60
done
