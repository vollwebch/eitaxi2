#!/bin/bash
export DATABASE_URL="file:/home/z/my-project/eitaxi-project/db/custom.db"
export NEXTAUTH_SECRET="eitaxi-secret-key-2024"
export NEXTAUTH_URL="http://localhost:3000"
cd /home/z/my-project/eitaxi-project
while true; do
    npx next dev -p 3000 >> /tmp/eitaxi-dev.log 2>&1
    echo "Restarting at $(date)..." >> /tmp/eitaxi-dev.log
    sleep 2
done
