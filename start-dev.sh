#!/bin/bash
cd /home/z/my-project/eitaxi-project
npx next dev -p 3000 &
echo $! > /home/z/my-project/eitaxi-project/.dev-server.pid
wait
