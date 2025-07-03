#!/bin/bash

# Exit on first error
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

mkdir -p logs
echo "Logs stored in ./logs"

# Array to store background process PIDs
pids=()

cleanup() {
  echo ""
  echo "Stopping all services..."
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" && echo "Stopped PID $pid"
    fi
  done
  echo "Cleanup complete. Bye!"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "🔧 Starting CORS proxy server..."
(
    cd routes
    python cors_server.py > ../logs/cors_server.log 2>&1 &
)
pids+=($!)
sleep 1  # Wait for the CORS server to start


echo "🛰️  Starting GPS simulator..."
(
    cd gps_simulator
    pip install -r requirements.txt > ../logs/gps_simulator_install.log 2>&1 &
    python simulator.py  > ../logs/gps_simulator.log 2>&1 &
) 
pids+=($!)
sleep 1  # Wait for the simulator to start

echo "🚀 Starting Spring Boot backend (etaengine)..."
(
    cd etaengine
    mvn clean install > ../logs/etaengine_build.log 2>&1 &
    java -jar target/etaengine.jar \
  --DB_USERNAME=$DB_USERNAME \
  --DB_PASSWORD=$DB_PASSWORD \
  > ../logs/etaengine.log 2>&1 &
)
pids+=($!)
sleep 5  # Wait for the backend to start

echo "🌐 Starting React frontend..."
(
    cd frontend
    npm install > ../logs/frontend_install.log 2>&1 &
    npm run dev > ../logs/frontend.log 2>&1 &
)
pids+=($!)
sleep 3  # Wait for the frontend to start

echo "All services started!"
echo "Press Ctrl+C to stop them gracefully."
sleep 3
start "" "http://localhost:5173"

# Wait forever (until killed)
while true; do
  sleep 1
done