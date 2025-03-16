#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

echo "Stopping any running Node processes..."
pkill -f node || true

echo "Changing to backend directory..."
cd backend

echo "Updating partner data directly in Redis..."
node direct-update-partners.js

echo "Starting backend server..."
cd ..
bash start-backend.sh &
echo "Backend server started at http://localhost:5001"

# Wait for backend to initialize
sleep 3

echo "Starting frontend server..."
bash start-frontend.sh &
echo "Frontend server started at http://localhost:3000"

echo "Both servers are now running!"
echo "You can access the application at http://localhost:3000"
echo "Login credentials:"
echo "  - Email: thomas.gregg@redis.com"
echo "  - Password: password123"
echo "  - OR -"
echo "  - Email: admin@redis.com"
echo "  - Password: admin123" 