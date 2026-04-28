#!/bin/bash
# EiTaxi Server Startup Script
# This is the single entry point to start everything

echo "========================================="
echo "  EiTaxi Server - Starting Up"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

cd /home/z/my-project

# Step 0: Ensure static assets are available in standalone directory
# (next build standalone doesn't include static files automatically)
echo "[0/3] Ensuring static assets in standalone..."
if [ -d ".next/static" ] && [ -d ".next/standalone" ]; then
    cp -r .next/static .next/standalone/.next/static 2>/dev/null
    cp -r public .next/standalone/public 2>/dev/null
    echo "  Static assets copied."
fi

# Export PM2 home
export PM2_HOME="/home/z/.pm2"

# Step 1: Start PM2 with our app
echo "[1/3] Starting PM2 application..."

if pm2 describe eitaxi > /dev/null 2>&1; then
    echo "  App exists in PM2, restarting..."
    pm2 restart eitaxi
else
    echo "  Starting fresh from ecosystem config..."
    pm2 start ecosystem.config.cjs
fi
pm2 save

# Step 2: Start Watchdog
echo "[2/3] Starting Watchdog..."
if ! pgrep -f "watchdog.sh" > /dev/null 2>&1; then
    nohup /home/z/my-project/watchdog.sh >> /tmp/watchdog-stdout.log 2>&1 &
    echo "  Watchdog started (PID: $!)"
else
    echo "  Watchdog already running"
fi

# Step 3: Verify
echo "[3/3] Verifying..."
sleep 5
STATUS=$(pm2 describe eitaxi 2>/dev/null | grep "^│ status" | awk '{print $NF}' | tr -d ' │')
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 http://localhost:3000/ 2>/dev/null)

echo "========================================="
echo "  PM2 Status: $STATUS"
echo "  HTTP Response: $HTTP"
echo "  Preview: https://preview-chat-c31365eb-aa33-4401-801f-590466ade053.space-z.ai/"
echo "========================================="
