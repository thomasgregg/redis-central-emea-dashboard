#!/bin/bash

# Use absolute path
BASE_DIR="/Users/tgregg/Documents/GitHub/redis/central-emea-dashboard"
cd "$BASE_DIR"

echo "Checking directory structure..."
echo "Current directory: $(pwd)"

# Check if backend directory exists
if [ ! -d "backend" ]; then
  echo "Error: backend directory not found!"
  exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
  echo "Error: frontend directory not found!"
  exit 1
fi

# Check if server.js exists
if [ ! -f "backend/server.js" ]; then
  echo "Error: backend/server.js not found!"
  exit 1
fi

echo "Directory structure looks good!"
echo "Making scripts executable..."

# Make all shell scripts executable
chmod +x *.sh
chmod +x backend/*.sh 2>/dev/null || true

echo "Killing any running Node processes..."
pkill -f node || true
sleep 2

echo "Resetting Redis database..."
cd backend
node reset-redis.js
sleep 2

echo "Updating partner data directly..."
node direct-update-partners.js
sleep 2

echo "Starting backend server..."
cd "$BASE_DIR"
bash start-backend.sh &
sleep 5

echo "Starting frontend server..."
bash start-frontend.sh &
sleep 5

echo "Process completed. Both servers should be running."
echo "You can access the application at http://localhost:3000"
echo "Login with:"
echo "  - Email: thomas.gregg@redis.com / Password: password123"
echo "  - OR -"
echo "  - Email: admin@redis.com / Password: admin123" 