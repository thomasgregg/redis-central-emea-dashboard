#!/bin/bash

# Change to the project directory
cd /Users/tgregg/Documents/GitHub/redis/central-emea-dashboard

# Kill any running Node processes
echo "Killing any running Node processes..."
pkill -f node || true
sleep 2

# Start the backend server
echo "Starting backend server..."
bash start-backend.sh &
sleep 5

# Update partner data
echo "Updating partner data..."
cd backend
npm install axios
node update-partner-data.js
sleep 2

# Start the frontend server
echo "Starting frontend server..."
cd ..
bash start-frontend.sh &
sleep 5

echo "Process completed. Both servers are running." 