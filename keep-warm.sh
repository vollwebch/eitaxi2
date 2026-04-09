#!/bin/bash
# Make a request to keep the server alive
curl -4 -s --connect-timeout 3 -o /dev/null http://127.0.0.1:3000/ 2>/dev/null
