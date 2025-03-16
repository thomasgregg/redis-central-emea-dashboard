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

# Start the backend server
echo "Starting backend server..."
cd ..
bash start-backend.sh &
sleep 5

# Install axios if needed
echo "Installing axios..."
cd backend
npm install axios

# Update partner data
echo "Updating partner data..."
node update-partner-data.js

echo "Process completed. Backend server is running." 