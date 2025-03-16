#!/bin/bash

# Change to the backend directory
cd "$(dirname "$0")/backend"

# Set environment variables
export PORT=5001
export JWT_SECRET="your-secret-key"

# Start the backend server
echo "Starting backend server on port $PORT..."
node server.js 