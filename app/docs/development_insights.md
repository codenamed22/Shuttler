# Learnings and Challenges Faced During Development

## Key Learnings

### 1. Real-Time Systems and WebSocket Handling

We built a real-time bus tracking system powered by WebSockets. Achieving stability for GPS and ETA sockets required us to implement retry logic, guard against out-of-order pings, and ensure clean synchronization with frontend listeners. These challenges gave us a deeper understanding of real-time streaming systems.

### 2. GPS Simulation and Data Streams

We developed a GPS Simulator to mimic realistic vehicle behavior. The simulator included stop dwell logic, occupancy changes, velocity variation, and realistic GPS noise. This simulator enabled our pipeline to be tested without dependency on live hardware.

### 3. Kalman Filtering for Smoother ETA Predictions

Instead of using simple techniques like moving average or exponential smoothing, we implemented Kalman filtering to estimate bus position and velocity. We learned how to tune process and measurement noise (“Q” and “R”) for different buses and conditions, making our predictions more resilient and accurate.

### 4. Frontend Integration with Live Data

We successfully consumed GPS and ETA WebSocket streams in a React frontend. Using React context and hooks, we dynamically updated bus positions and stop ETAs. We also implemented testing infrastructure using Jest and mock services, and learned to debug rendering and socket issues in real time.

### 5. Spring Boot Backend and MySQL Setup

We learned how to build a Spring Boot application integrated with MySQL, expose APIs for bus and stop data, configure CORS, and load route data from GeoJSON. We automated environment configuration and implemented structured DTOs and entity relationships.

---

## Challenges Faced

### Socket Stability and Ordering

Initially, GPS WebSocket streams were unstable and sometimes flooded or delivered out-of-order pings. We addressed this with reconnection backoff, timestamp validation, and better coordination across GPSListener and EtaPredictor modules.

### ETA Values Not Updating Properly

There were moments when the same ETA was shown for all stops, or the ETA never updated. This was traced to segment indexing bugs, stale state not being flushed, and improper velocity smoothing. Debugging this required us to track bus motion more carefully.

### Testing Infrastructure Setup

Setting up Jest with TypeScript and WebSocket mocks took several attempts. We dealt with multiple versions of libraries, Babel configurations, and the challenge of mocking asynchronous socket behavior.

### Route Data Integration

We learned to parse and inject route data from `.geojson` files. Since route metadata had to be shared across simulator, backend, and frontend, we built central loaders and used the Haversine formula for distance accuracy.

### Database Bootstrapping & Startup Automation

Coordinating MySQL, Spring Boot, GPS simulator, CORS server, and frontend via `start.sh` was non-trivial. Failures in any single component (e.g., missing `.jar`, missing route files) could cascade, so we added logs, retry logic, and environment variables.

---

## Component-Specific Insights

### GeoUtils.java

* **Challenges**: Computing real distances between GPS points using latitude/longitude is non-trivial. We used the Haversine formula to ensure accuracy and minimize cumulative error.
* **Learnings**: Geospatial logic centralized in a utility class avoids duplication and simplifies updates across modules.

### GPS Simulator

* **Challenges**: Realistic route traversal, stop detection, GPS noise modeling, occupancy flow, and handling route boundaries.
* **Learnings**: Proper state modeling (pause, reverse, occupancy) adds realism. Randomness must be bounded to maintain reliability. Tick syncing and Gaussian noise tuning were key.

### Simulator Broadcaster

* **Challenges**: Maintaining consistent ping intervals, running multiple simulators concurrently, and broadcasting cleanly to clients.
* **Learnings**: AsyncIO allowed efficient concurrency. Centralized broadcasting simplified architecture. `asyncio.Future()` kept the server running smoothly.

### Spring Boot Route Loader

* **Challenges**: Loading deeply nested GeoJSON into Java models and validating route structure.
* **Learnings**: Jackson's tree model offered flexibility. We validated each layer to avoid runtime errors. Registering stops as Spring beans enabled clean dependency injection.

### Spring WebSocket Config

* **Challenges**: Registering raw WebSocket endpoints and handling cross-origin frontend connections.
* **Learnings**: Spring's WebSocketConfigurer enabled full control. Allowing all origins (for dev) prevented CORS errors. Raw WebSocket was lighter than STOMP for our needs.

### BusStateTracker.java

* **Challenges**: Avoiding duplicate arrivals, accurately determining stop proximity with noisy GPS.
* **Learnings**: Time-based thresholds and Haversine distance worked best. In-memory state reduced overhead.

### Dashboard.java

* **Challenges**: Matching predicted and actual ETAs, handling uneven or sparse prediction data.
* **Learnings**: Java streams simplified filtering and matching logic. Evaluating ETA accuracy helped us improve prediction algorithms.

### EtaPredictor.java

* **Challenges**: Coping with near-zero speeds, missing GPS pings, and noisy input.
* **Learnings**: Kalman filtering smoothed predictions effectively. Broadcasting only on real changes reduced noise for frontend.

### GPSListener.java

* **Challenges**: Filtering duplicates and coordinating updates across modules.
* **Learnings**: Decoupling responsibilities improved extensibility and made testing easier.

### Routes.java

* **Challenges**: Mapping stops to route segments and computing proximity accurately.
* **Learnings**: Pre-mapping stop segments at load time boosted performance and accuracy.

### LiveBusContext

* **Challenges**: Managing live updates from two WebSocket feeds (GPS and ETA) while maintaining a unified state.
* **Learnings**: Using React context with useRef allowed us to maintain real-time state without excessive re-renders.

### BusEtaTable & ETA Dashboard

* **Challenges**: Visualizing real-time ETA updates cleanly without UI jitter or lag.
* **Learnings**: Memoization and sorting logic were key. Grouping ETAs per stop and refreshing efficiently gave a smooth experience.

### Map Rendering (Leaflet)

* **Challenges**: Dynamically updating markers without flicker or redraw bugs.
* **Learnings**: Leveraging unique keys and only updating changed elements avoided full rerenders. Marker icons were tuned for clarity.

### Socket Event Handling

* **Challenges**: Handling socket drops and reconnect logic gracefully.
* **Learnings**: Implementing backoff retry and showing UI alerts helped us inform users of lost connectivity.

### Testing

* **Challenges**: Mocking WebSocket behavior in tests.
* **Learnings**: Custom mock services and event simulators gave us confidence in our UI logic.

---

## Conclusion

This project taught our team how to build a full-stack, real-time system from scratch. We learned to simulate complex GPS motion, apply predictive filters, build robust backend pipelines, and synchronize with a frontend. We faced technical challenges across concurrency, simulation realism, UI responsiveness, and state synchronization but overcame them through iteration, collaboration, and thoughtful system design. These skills and lessons will stay with us far beyond this project.