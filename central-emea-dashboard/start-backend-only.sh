#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

echo "Killing any running Node processes..."
pkill -f node || true
sleep 2

echo "Starting backend server directly..."
cd backend
node start-backend-direct.js

echo "Backend server should now be running at http://localhost:5001"
echo "You can test it with: curl -X POST -H 'Content-Type: application/json' -d '{\"email\":\"thomas.gregg@redis.com\",\"password\":\"password123\"}' http://localhost:5001/api/login" 