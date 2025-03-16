#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

echo "Making scripts executable..."
chmod +x *.sh
chmod +x backend/*.sh 2>/dev/null || true

echo "Running run-all.sh to start the servers..."
./run-all.sh 