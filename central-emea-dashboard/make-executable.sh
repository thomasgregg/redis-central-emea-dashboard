#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

echo "Making scripts executable..."

# Make all shell scripts executable
chmod +x *.sh
chmod +x backend/*.sh

echo "Scripts are now executable"
echo "You can now run ./run-all.sh to start everything"

chmod +x /Users/tgregg/Documents/GitHub/redis/central-emea-dashboard/start.sh
/Users/tgregg/Documents/GitHub/redis/central-emea-dashboard/start.sh 