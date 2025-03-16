#!/bin/bash

# Clear the terminal
clear

echo "==================================================="
echo "   Central EMEA Dashboard - Application Launcher   "
echo "==================================================="
echo ""

# Check if backend is already running
echo "Checking if backend server is already running..."
if curl -s http://localhost:5001/api/login -X POST -H "Content-Type: application/json" -d '{"email":"thomas.gregg@redis.com","password":"password123"}' > /dev/null; then
  echo "✅ Backend server is already running on port 5001"
  BACKEND_RUNNING=true
else
  echo "❌ Backend server is not running"
  BACKEND_RUNNING=false
fi

# Check if any server is running on port 3000
echo "Checking if port 3000 is available..."
if nc -z localhost 3000 2>/dev/null; then
  echo "❌ Port 3000 is already in use"
  PORT_3000_AVAILABLE=false
else
  echo "✅ Port 3000 is available"
  PORT_3000_AVAILABLE=true
fi

echo ""
echo "Starting the application..."
echo ""

# Start backend if not running
if [ "$BACKEND_RUNNING" = false ]; then
  echo "Starting backend server..."
  cd backend
  npm run dev &
  BACKEND_PID=$!
  cd ..
  echo "Backend server started with PID: $BACKEND_PID"
  
  # Wait for backend to start
  echo "Waiting for backend server to start..."
  for i in {1..10}; do
    if curl -s http://localhost:5001/api/login -X POST -H "Content-Type: application/json" -d '{"email":"thomas.gregg@redis.com","password":"password123"}' > /dev/null; then
      echo "✅ Backend server is now running"
      break
    fi
    sleep 1
    echo "."
  done
fi

# Start frontend
echo "Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "==================================================="
echo "   Application is starting up!                     "
echo "==================================================="
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Login with:"
echo "Email: thomas.gregg@redis.com"
echo "Password: password123"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "==================================================="

# Function to handle script termination
function cleanup {
  echo ""
  echo "Stopping servers..."
  if [ "$BACKEND_RUNNING" = false ] && [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null
  fi
  echo "Servers stopped"
  exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Keep script running
wait 