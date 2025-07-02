#!/bin/bash

# Exit on first error
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🔧 Starting CORS proxy server..."
(
    cd routes
    python cors_server.py > ../logs/cors_server.log 2>&1
) &
sleep 1  # Wait for the CORS server to start


echo "🛰️  Starting GPS simulator..."
(
    cd gps_simulator
    python simulator.py  > ../logs/gps_simulator.log 2>&1
) &
sleep 1  # Wait for the simulator to start

echo "🚀 Starting Spring Boot backend (etaengine)..."
(
    cd etaengine
    mvn clean install > ../logs/etaengine_build.log 2>&1
    java -jar target/etaengine.jar \
  --DB_USERNAME=$DB_USERNAME \
  --DB_PASSWORD=$DB_PASSWORD \
  > ../logs/etaengine.log 2>&1
) &
sleep 5  # Wait for the backend to start

echo "🌐 Starting React frontend..."
(
    cd frontend
    npm install > ../logs/frontend_install.log 2>&1
    npm run dev > ../logs/frontend.log 2>&1
) &
sleep 3  # Wait for the frontend to start

# Final confirmation
echo "✅ All services started in background. Check the 'logs/' folder for output."