#!/bin/bash

echo "Starting a simple HTTP server for the built application..."

# Navigate to the frontend/dist directory
cd "$(dirname "$0")/frontend/dist"

# Start a simple HTTP server
echo "Server running at http://localhost:8080"
echo "Press Ctrl+C to stop the server"
echo ""
echo "Login with:"
echo "Email: thomas.gregg@redis.com"
echo "Password: password123"
echo ""

# Open the application in the default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open http://localhost:8080
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open http://localhost:8080
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  start http://localhost:8080
fi

# Start the server
python3 -m http.server 8080 || python -m SimpleHTTPServer 8080 