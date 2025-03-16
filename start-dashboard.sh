#!/bin/bash

# Navigate to the correct directory
cd /Users/tgregg/Documents/GitHub/redis

echo "Current directory: $(pwd)"
echo "Listing directories:"
ls -la

echo "Checking for central-emea-dashboard directory..."
if [ -d "central-emea-dashboard" ]; then
  echo "Found central-emea-dashboard directory!"
  cd central-emea-dashboard
  
  echo "Current directory: $(pwd)"
  echo "Listing files:"
  ls -la
  
  echo "Making run-all.sh executable..."
  chmod +x run-all.sh
  
  echo "Running run-all.sh..."
  ./run-all.sh
else
  echo "Error: central-emea-dashboard directory not found!"
  exit 1
fi 