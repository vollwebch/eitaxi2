#!/bin/bash
# keepalive.sh - Keeps the Next.js server alive
while true; do
  curl -s http://localhost:3000/api/warmup > /dev/null 2>&1
  sleep 45
done
