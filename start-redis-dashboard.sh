#!/bin/bash

# Navigate to the correct directory
cd /Users/tgregg/Documents/GitHub/redis/central-emea-dashboard

echo "Current directory: $(pwd)"
echo "Checking directory structure..."

# Check if backend directory exists
if [ ! -d "backend" ]; then
  echo "Error: backend directory not found!"
  exit 1
fi

echo "Killing any running Node processes..."
pkill -f node || true
sleep 2

echo "Starting backend server directly..."
cd backend
node start-backend-direct.js

echo "Backend server should now be running at http://localhost:5001"

bash /Users/tgregg/Documents/GitHub/redis/central-emea-dashboard/start-servers.sh 