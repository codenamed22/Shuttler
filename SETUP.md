# Shuttler - Real-Time Bus Tracking System Setup Guide

This comprehensive guide will help you set up and run the complete Shuttler real-time bus tracking system on your local machine.

## System Overview

The Shuttler system consists of four main components:

1. **GPS Simulator** (Python) - Simulates real-time bus GPS data
2. **ETA Engine** (Spring Boot/Java) - Processes GPS data and predicts arrival times
3. **Frontend** (React/TypeScript) - Interactive web interface for tracking buses
4. **CORS Proxy Server** (Python) - Serves route GeoJSON files with CORS headers
5. **MySQL Database** - Stores ETA predictions and arrival data

## Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software

- **Java 17+** - Required for Spring Boot application
- **Maven 3.6+** - For building the Java backend
- **Node.js 18+** and **npm** - For the React frontend
- **Python 3.8+** and **pip** - For GPS simulator and CORS server
- **MySQL 8.0+** - Database server
- **Git** - For version control (if cloning)

### Verify Prerequisites

Run these commands to verify your installations:

```powershell
# Check Java version
java -version

# Check Maven version
mvn -version

# Check Node.js and npm versions
node --version
npm --version

# Check Python version
python --version

# Check MySQL installation
mysql --version
```

## Environment Setup

### 1. Database Configuration

#### Create Environment File

Create a `.env` file in the project root directory:

```bash
# Database Configuration
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
```

#### Set up MySQL Database

1. **Start MySQL service**:

   ```powershell
   # Start MySQL service (Windows)
   net start mysql
   ```

2. **Create database and import schema**:

   ```powershell
   # Login to MySQL
   mysql -u root -p

   # Create database
   CREATE DATABASE IF NOT EXISTS shuttle_db;
   USE shuttle_db;
   exit

   # Import the database dump
   mysql -u root -p shuttle_db < "app/full_dump.sql"
   ```

3. **Verify database setup**:

   ```sql
   USE shuttle_db;
   SHOW TABLES;
   SELECT COUNT(*) FROM eta_predictions;
   SELECT COUNT(*) FROM stop_arrivals;
   ```

## Quick Start (Automated)

The easiest way to run the entire system is using the provided `start.sh` script:

### For Windows Users

Since the script is written for bash, you have a few options:

#### Option 1: Use Git Bash

```bash
cd app
bash start.sh
```

#### Option 2: Manual Component Startup (Recommended for Windows)

Follow the manual setup steps below to start each component individually.

## Manual Setup (Step-by-Step)

If you prefer to understand each component or need to troubleshoot, follow these manual steps:

### 1. Start CORS Proxy Server

```powershell
cd app/routes
python cors_server.py
```

**Expected output**: Server starts on `http://localhost:8000`

### 2. Start GPS Simulator

```powershell
cd app/gps_simulator
pip install -r requirements.txt
python simulator.py
```

**Expected output**: WebSocket server starts on `ws://localhost:8765`

### 3. Start ETA Engine (Spring Boot Backend)

```powershell
cd app/etaengine
mvn clean install
java -jar target/etaengine-0.0.1-SNAPSHOT.jar --DB_USERNAME=your_username --DB_PASSWORD=your_password
```

**Expected output**: Spring Boot app starts on `http://localhost:8080`

### 4. Start React Frontend

```powershell
cd app/frontend
npm install
npm run dev
```

**Expected output**: Vite dev server starts on `http://localhost:5173`

## System Architecture

### Port Configuration

- **Frontend (React)**: `http://localhost:5173`
- **Backend (Spring Boot)**: `http://localhost:8080`
- **CORS Proxy**: `http://localhost:8000`
- **GPS Simulator WebSocket**: `ws://localhost:8765`
- **ETA WebSocket**: `ws://localhost:8080/ws/eta`
- **MySQL Database**: `localhost:3306`

### Data Flow

1. **GPS Simulator** generates mock GPS coordinates and broadcasts them via WebSocket (`ws://localhost:8765`)
2. **ETA Engine** connects to GPS simulator, processes GPS data, and:
   - Applies Kalman filtering for position smoothing
   - Calculates ETAs using route data
   - Stores predictions in MySQL database
   - Broadcasts live updates via WebSocket (`ws://localhost:8080/ws/eta`)
3. **Frontend** connects to ETA Engine WebSocket and displays:
   - Real-time bus positions on interactive map
   - Live ETA predictions for each stop
   - Route visualization with stop markers
4. **CORS Proxy** serves GeoJSON route files with proper CORS headers

## Database Schema

The system uses two main tables:

### `eta_predictions` Table

- `id` - Primary key
- `bus_id` - Bus identifier (e.g., 'bus01')
- `stop_id` - Stop identifier (e.g., 'stop_kc_1')
- `stop_name` - Human-readable stop name
- `predicted_arrival_time` - Predicted arrival time
- `created_at` - Record creation timestamp
- `date` - Prediction date

### `stop_arrivals` Table

- `id` - Primary key
- `bus_id` - Bus identifier
- `stop_id` - Stop identifier
- `stop_name` - Human-readable stop name
- `arrival_time` - Actual arrival time
- `date` - Arrival date
- `created_at` - Record creation timestamp

## Accessing the Application

Once all services are running:

1. **Open your browser** and navigate to: `http://localhost:5173`
2. **You should see**:
   - Interactive map with KIIT Campus Loop route
   - Real-time bus positions (simulated)
   - ETA predictions for each stop
   - Bus information cards with live updates

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

**Error**: `Could not connect to MySQL database`

**Solutions**:

- Verify MySQL service is running: `net start mysql`
- Check credentials in `.env` file
- Ensure database `shuttle_db` exists
- Verify firewall settings allow MySQL connections

#### 2. Port Already in Use

**Error**: `Port XXXX already in use`

**Solutions**:

- Kill existing processes using the port:

  ```powershell
  # Find process using port 8080
  netstat -ano | findstr :8080
  # Kill process by PID
  taskkill /PID <PID> /F
  ```

- Change port configuration in respective configuration files

#### 3. Java/Maven Issues

**Error**: `Java version incompatibility`

**Solutions**:

- Ensure Java 17+ is installed and set in PATH
- Update `JAVA_HOME` environment variable
- Clean Maven cache: `mvn clean install -U`

#### 4. Node.js/npm Issues

**Error**: `npm install fails`

**Solutions**:

- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then reinstall
- Use Node.js 18+ (latest LTS recommended)

#### 5. Python Dependencies Issues

**Error**: `Module not found`

**Solutions**:

- Ensure Python 3.8+ is installed
- Install dependencies: `pip install -r requirements.txt`
- Use virtual environment if needed:

  ```powershell
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  ```

#### 6. WebSocket Connection Issues

**Error**: `WebSocket connection failed`

**Solutions**:

- Ensure all services are running in correct order
- Check firewall/antivirus blocking WebSocket connections
- Verify port configurations match between services
- Clear browser cache and cookies

#### 7. CORS Issues

**Error**: `CORS policy blocked`

**Solutions**:

- Ensure CORS proxy server is running on port 8000
- Check if antivirus is blocking the CORS server
- Verify GeoJSON files exist in `/routes` directory

### Service Health Checks

Use these endpoints to verify services are running:

- **Backend Health**: `http://localhost:8080/actuator/health` (if actuator is enabled)
- **Frontend**: `http://localhost:5173`
- **CORS Proxy**: `http://localhost:8000/route_kiit_campus_loop.geojson`

### Log Files

Check log files in the `logs/` directory for detailed error information:

- `etaengine.log` - Backend application logs
- `frontend.log` - Frontend build/runtime logs
- `gps_simulator.log` - GPS simulator logs
- `cors_server.log` - CORS proxy server logs

### Performance Optimization

For better performance:

1. **Increase Java heap size**:

   ```powershell
   java -Xmx2g -jar target/etaengine-0.0.1-SNAPSHOT.jar
   ```

2. **Use production build for frontend**:

   ```powershell
   npm run build
   npm run preview
   ```

3. **Optimize MySQL configuration** for your system resources

## Development Tips

### Making Changes

- **Backend changes**: Restart Spring Boot application
- **Frontend changes**: Vite hot-reload will update automatically
- **Database schema changes**: Update `full_dump.sql` and reimport
- **Route changes**: Modify GeoJSON files in `/routes` directory

### Adding New Routes

1. Create new GeoJSON file in `/routes` directory
2. Update route mapping in frontend (`src/constants/routeMap.ts`)
3. Add corresponding database entries for new stops

## Support

If you encounter issues not covered in this guide:

1. Check the log files in the `logs/` directory
2. Verify all prerequisites are correctly installed
3. Ensure all environment variables are properly set
4. Try restarting services in the correct order

---

**Note**: This system includes sample data for the KIIT Campus Loop route with 8 stops. The GPS simulator will generate realistic movement patterns for testing purposes.
