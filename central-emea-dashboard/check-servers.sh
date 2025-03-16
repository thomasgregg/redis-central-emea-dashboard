#!/bin/bash

echo "Checking if servers are running..."

# Check backend server
echo -n "Backend server (port 5001): "
if curl -s http://localhost:5001/api/login -X POST -H "Content-Type: application/json" -d '{"email":"thomas.gregg@redis.com","password":"password123"}' > /dev/null; then
  echo "RUNNING ✅"
else
  echo "NOT RUNNING ❌"
fi

# Check frontend server
echo -n "Frontend server (port 3000): "
if curl -s http://localhost:3000 > /dev/null; then
  echo "RUNNING ✅"
else
  echo "NOT RUNNING ❌"
fi

echo ""
echo "If both servers are running, open your browser and go to:"
echo "http://localhost:3000"
echo ""
echo "Login with:"
echo "Email: thomas.gregg@redis.com"
echo "Password: password123" 