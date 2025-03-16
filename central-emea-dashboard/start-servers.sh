#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

# Kill any running Node processes
echo "Killing any running Node processes..."
pkill -f node || true
sleep 2

# Reset Redis database
echo "Resetting Redis database..."
cd backend
node reset-redis.js
sleep 2

# Update partner data directly
echo "Updating partner data directly..."
node direct-update-partners.js
sleep 2

# Start the backend server
echo "Starting backend server..."
cd ..
cd backend
node server.js > ../backend.log 2>&1 &
sleep 5

# Start the frontend server
echo "Starting frontend server..."
cd ../frontend
npm start > ../frontend.log 2>&1 &
sleep 5

echo "Process completed. Both servers are running."
echo "You can access the application at http://localhost:3000"
echo "Login with:"
echo "  - Email: thomas.gregg@redis.com / Password: password123"
echo "  - OR -"
echo "  - Email: admin@redis.com / Password: admin123" 