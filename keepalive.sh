#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting server..."
  rm -rf .next
  bun run dev &>/tmp/next-server.log &
  SERVER_PID=$!
  
  # Wait for server to be ready
  for i in $(seq 1 30); do
    if curl -s --max-time 2 http://localhost:3000/ >/dev/null 2>&1; then
      echo "[$(date)] Server ready (PID: $SERVER_PID)"
      break
    fi
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "[$(date)] Server died during startup"
      break
    fi
    sleep 1
  done
  
  # Keepalive: ping server every 5s
  while kill -0 $SERVER_PID 2>/dev/null; do
    sleep 5
    curl -s --max-time 2 http://localhost:3000/api/taxis >/dev/null 2>&1
  done
  
  echo "[$(date)] Server died, restarting in 3s..."
  sleep 3
done
