# Shuttler

## Real-Time Shuttle Tracker & ETA Predictor

**Background:**
Your university’s shuttle system currently publishes raw GPS pings only. Commuters have no easy way to know when the next bus will arrive, leading to wasted time and overcrowded stops.

**Your Mission:**
Build a **streaming pipeline + frontend** that

1. **Ingests** a live or replayed GPS feed for each bus.
2. **Smooths & predicts** arrival times at upcoming stops (using a Kalman filter or moving-average model).
3. **Visualizes** moving buses and ETAs on an interactive map.

**MVP Requirements:**

* A data-producer script (or simulator) publishing JSON `{ busId, lat, lon, timestamp }` over WebSocket or REST.
* An ETA engine service that consumes the feed, applies a smoothing filter, and outputs predicted arrival times for each stop.
* A React (or equivalent) frontend with Leaflet.js showing live bus locations and countdown labels at stops.
* A simple “prediction-error” dashboard comparing predicted vs. actual arrival times.

**Evaluation Criteria:**

* **Correctness of ETAs:** average error and variance.
* **System design:** handling out-of-order or delayed pings, reconnections.
* **UX clarity:** map performance, clear ETA display, mobile-friendly layout.
* **Stretch work (bonus):** multi-route support, occupancy heatmap, P2P fallback over WebRTC.
