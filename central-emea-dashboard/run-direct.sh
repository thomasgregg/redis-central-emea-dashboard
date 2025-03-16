#!/bin/bash

# Use absolute path to ensure we're in the right directory
cd /Users/tgregg/Documents/GitHub/redis/central-emea-dashboard

echo "Current directory: $(pwd)"
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
cd ..
bash start-backend.sh &
sleep 5

echo "Starting frontend server..."
bash start-frontend.sh &
sleep 5

echo "Process completed. Both servers are running."
echo "You can access the application at http://localhost:3000"
echo "Login with:"
echo "  - Email: thomas.gregg@redis.com / Password: password123"
echo "  - OR -"
echo "  - Email: admin@redis.com / Password: admin123" 