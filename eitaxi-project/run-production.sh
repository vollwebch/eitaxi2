#!/bin/sh
set -e

cd /home/z/my-project/eitaxi-project

export DATABASE_URL="file:/home/z/my-project/eitaxi-project/db/custom.db"
export NEXTAUTH_SECRET="eitaxi-secret-key-2024"
export NEXTAUTH_URL="http://localhost:3000"
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

echo "Starting Next.js production server..."
cd .next/standalone
node server.js &
NEXT_PID=$!
cd /home/z/my-project/eitaxi-project

echo "Waiting for Next.js on port 3000..."
sleep 3

if kill -0 $NEXT_PID 2>/dev/null; then
    echo "Next.js started (PID: $NEXT_PID)"
else
    echo "Next.js failed to start"
    exit 1
fi

echo "Starting Caddy..."
exec caddy run --config Caddyfile --adapter caddyfile
