#!/bin/bash
while true; do
  sleep 30
  curl -s -o /dev/null http://localhost:3000/warmup || pm2 restart eitaxi 2>/dev/null
done
