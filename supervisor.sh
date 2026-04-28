#!/bin/bash
# EiTaxi Supervisor - Ensures PM2 and Watchdog are always running
# This is the ENTRY POINT that should be run on server startup
# It starts PM2, starts the watchdog, and monitors the watchdog itself

SUPERVISOR_LOG="/home/z/my-project/supervisor.log"
SUPERVISOR_PID=$$

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUPERVISOR] $1" >> "$SUPERVISOR_LOG"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUPERVISOR] $1"
}

log "=== EiTaxi Supervisor Starting (PID: $SUPERVISOR_PID) ==="

# Step 1: Ensure PM2 is running with our app
cd /home/z/my-project

# Check if PM2 God daemon is running
if ! pgrep -f "PM2.*v" > /dev/null 2>&1; then
    log "Starting PM2 daemon..."
    export PM2_HOME="/home/z/.pm2"
fi

# Check if our app is in PM2
APP_STATUS=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')
if [ "$APP_STATUS" != "online" ]; then
    log "Starting eitaxi via ecosystem config..."
    pm2 start ecosystem.config.cjs
    pm2 save
fi

# Step 2: Ensure Watchdog is running
if ! pgrep -f "watchdog.sh" > /dev/null 2>&1; then
    log "Starting Watchdog..."
    nohup /home/z/my-project/watchdog.sh >> /tmp/watchdog-stdout.log 2>&1 &
    log "Watchdog started (PID: $!)"
fi

# Step 3: Monitor the watchdog itself (meta-supervision!)
log "Now monitoring Watchdog process..."

while true; do
    # Check watchdog
    if ! pgrep -f "watchdog.sh" > /dev/null 2>&1; then
        log "⚠️  Watchdog died! Restarting it..."
        nohup /home/z/my-project/watchdog.sh >> /tmp/watchdog-stdout.log 2>&1 &
        log "Watchdog restarted (PID: $!)"
    fi
    
    # Check PM2 app
    APP_STATUS=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')
    if [ "$APP_STATUS" != "online" ]; then
        log "⚠️  App not online via supervisor! Restarting..."
        pm2 restart eitaxi 2>/dev/null
        pm2 save
    fi
    
    # Clean supervisor log
    if [ -f "$SUPERVISOR_LOG" ] && [ $(wc -l < "$SUPERVISOR_LOG") -gt 500 ]; then
        tail -100 "$SUPERVISOR_LOG" > "${SUPERVISOR_LOG}.tmp" && mv "${SUPERVISOR_LOG}.tmp" "$SUPERVISOR_LOG"
    fi
    
    sleep 120  # Check every 2 minutes
done
