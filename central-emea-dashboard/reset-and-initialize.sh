#!/bin/bash

# Change to the project directory
cd /Users/tgregg/Documents/GitHub/redis/central-emea-dashboard

# Kill any running Node processes
echo "Killing any running Node processes..."
pkill -f node || true

# Reset Redis database
echo "Resetting Redis database..."
cd backend
node reset-redis.js
sleep 2

# Initialize Redis with real data
echo "Initializing Redis with real data..."
node initialize-data.js
sleep 2

# Start the backend server
echo "Starting backend server..."
cd ..
bash start-backend.sh &
sleep 5

echo "Process completed. Backend server is running."
echo "Now you can start the frontend server with: bash start-frontend.sh" 