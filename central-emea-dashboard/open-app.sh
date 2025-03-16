#!/bin/bash

echo "Opening Central EMEA Dashboard in your browser..."

# Open the application in the default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open http://localhost:3000
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  start http://localhost:3000
else
  echo "Could not detect your operating system."
  echo "Please open http://localhost:3000 in your browser manually."
fi

echo ""
echo "Login with:"
echo "Email: thomas.gregg@redis.com"
echo "Password: password123"
echo ""
echo "If the application doesn't load, make sure both servers are running:"
echo "./check-servers.sh" 