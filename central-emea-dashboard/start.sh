#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

echo "Making scripts executable..."
chmod +x run-all.sh
chmod +x start-backend.sh
chmod +x start-frontend.sh

echo "Running run-all.sh..."
./run-all.sh 