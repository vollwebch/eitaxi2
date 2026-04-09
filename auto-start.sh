#!/bin/bash
# Kill any existing processes
pkill -f "next dev" 2>/dev/null
sleep 1

cd /home/z/my-project/eitaxi-project
export DATABASE_URL="file:/home/z/my-project/eitaxi-project/db/custom.db"
export NEXTAUTH_SECRET="eitaxi-secret-key-2024"
export NEXTAUTH_URL="http://localhost:3000"

# Check if port 3000 is already in use
if ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "Port 3000 already in use, skipping"
    exit 0
fi

# Start server
nohup npx next dev -p 3000 > /tmp/eitaxi.log 2>&1 &
echo "Server started with PID $!"
