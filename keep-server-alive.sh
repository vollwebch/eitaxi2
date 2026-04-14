#!/bin/bash
cd /home/z/my-project
while true; do
  rm -rf .next 2>/dev/null
  bun run dev 2>&1
  sleep 2
done
