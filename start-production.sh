#!/bin/bash
cd /home/z/eitaxi-restored
pm2 delete eitaxi 2>/dev/null
pm2 start npm --name "eitaxi" -- start
pm2 start pm2-logrotate --no-daemon 2>/dev/null
echo "Production started"
