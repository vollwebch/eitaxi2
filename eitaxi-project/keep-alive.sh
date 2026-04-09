#!/bin/bash
while true; do
    cd /home/z/my-project/eitaxi-project/.next/standalone
    node server.js >> /tmp/eitaxi-server.log 2>&1
    echo "Server crashed at $(date), restarting in 2s..." >> /tmp/eitaxi-server.log
    sleep 2
done
