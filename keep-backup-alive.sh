#!/bin/bash
while true; do
    if ! pgrep -f "watch-and-backup.sh" > /dev/null 2>&1; then
        nohup bash /home/z/eitaxi-restored/watch-and-backup.sh > /home/z/eitaxi-restored/backup-loop.log 2>&1 &
        echo "[$(date)] Backup process restarted"
    fi
    sleep 30
done
