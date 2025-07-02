# Database Setup Guide

This guide will help you set up the MySQL database for the Shuttler real-time bus tracking system using the provided `full_dump.sql` file.

## Prerequisites

Before setting up the database, ensure you have:

- **MySQL Server 8.0+** installed on your system

## Database Overview

The Shuttler system uses a MySQL database named `shuttle_db` with the following tables:

### 1. `eta_predictions` Table
Stores predicted arrival times for buses at various stops.

**Columns:**
- `id` (bigint, PRIMARY KEY, AUTO_INCREMENT)
- `bus_id` (varchar(255), NOT NULL) - Bus identifier (e.g., 'bus01')
- `stop_id` (varchar(255), NOT NULL) - Stop identifier (e.g., 'stop_kc_1')
- `stop_name` (varchar(255)) - Human-readable stop name
- `predicted_arrival_time` (datetime, NOT NULL) - Predicted arrival time
- `created_at` (timestamp, DEFAULT CURRENT_TIMESTAMP) - Record creation time
- `date` (date, NOT NULL) - Date of the prediction

### 2. `stop_arrivals` Table
Records actual bus arrivals at stops for accuracy tracking.

**Columns:**
- `id` (bigint, PRIMARY KEY, AUTO_INCREMENT)
- `bus_id` (varchar(255), NOT NULL) - Bus identifier
- `stop_id` (varchar(255), NOT NULL) - Stop identifier
- `stop_name` (varchar(255)) - Human-readable stop name
- `arrival_time` (datetime, NOT NULL) - Actual arrival time
- `date` (date, NOT NULL) - Date of arrival
- `created_at` (timestamp, DEFAULT CURRENT_TIMESTAMP) - Record creation time

## Setup Instructions

### Option 1: Using MySQL Command Line

1. **Start MySQL service** (if not already running):


2. **Login to MySQL** :


3. **Create the database** (if it doesn't exist):
   ```sql
   CREATE DATABASE IF NOT EXISTS shuttle_db;
   USE shuttle_db;
   ```

4. **Import the dump file through cmd or powershell**:
   ```bash
   # Exit MySQL first
   exit
   
   # Import the dump file
   mysql -u root -p shuttle_db < "app/full_dump.sql"
   ```


## Database Configuration

### Connection Parameters

Update your application configuration with these database connection details:

```properties
# application.properties (Spring Boot)
spring.datasource.url=jdbc:mysql://localhost:3306/shuttle_db
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```


## Verification

After setup, verify the database is working correctly:

### Check Tables
```sql
USE shuttle_db;
SHOW TABLES;
```

Expected output:
```
+----------------------+
| Tables_in_shuttle_db |
+----------------------+
| eta_predictions      |
| stop_arrivals        |
+----------------------+
```

### Check Data
```sql
-- Check eta_predictions table
SELECT COUNT(*) as total_predictions FROM eta_predictions;

-- Check stop_arrivals table  
SELECT COUNT(*) as total_arrivals FROM stop_arrivals;

-- View recent predictions
SELECT bus_id, stop_name, predicted_arrival_time, created_at 
FROM eta_predictions 
ORDER BY created_at DESC 
LIMIT 5;
```

### Sample Routes Data

The database contains data for the KIIT Campus Loop route with these stops:

1. **stop_kc_1** - KIIT Campus 6
2. **stop_kc_2** - KIIT Campus 3  
3. **stop_kc_3** - KIMS Gate
4. **stop_kc_4** - Shikharachandi
5. **stop_kc_5** - Infocity Square
6. **stop_kc_6** - Sai International
7. **stop_kc_7** - KIIT Campus 15
8. **stop_kc_8** - KP-7



## Next Steps

After successful database setup:

1. **Configure your Spring Boot application** with the correct database credentials
2. **Start the ETA Engine service** to begin receiving GPS data
3. **Run the GPS simulator** to test the system with mock data
4. **Access the frontend** to view real-time bus tracking

---

**Note**: This database contains sample data from June 30, 2025. The ETA predictions and stop arrivals are for testing purposes and demonstrate the system's data structure and functionality.