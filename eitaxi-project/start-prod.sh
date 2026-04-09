#!/bin/bash
cd /home/z/my-project/eitaxi-project/.next/standalone
export DATABASE_URL="file:/home/z/my-project/eitaxi-project/db/custom.db"
export NEXTAUTH_SECRET="eitaxi-secret-key-2024"
export NEXTAUTH_URL="http://localhost:3000"
while true; do
    node server.js > /tmp/eitaxi-prod.log 2>&1
    echo "Restarting at $(date)..." >> /tmp/eitaxi-prod.log
    sleep 1
done
