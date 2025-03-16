#!/bin/bash

# Change to the frontend directory
cd "$(dirname "$0")/frontend"

# Set environment variables
export PORT=3000
export REACT_APP_API_URL="http://localhost:5001"

# Start the frontend server
echo "Starting frontend server on port $PORT..."
npm start 