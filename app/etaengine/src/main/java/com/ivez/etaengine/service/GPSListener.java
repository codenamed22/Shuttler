package com.ivez.etaengine.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivez.etaengine.model.*;
import com.ivez.etaengine.ws.EtaWebSocketHandler;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.Map;

@Service
public class GPSListener extends WebSocketClient {

    private final BusStateTracker     busStateTracker;
    private final EtaPredictor        etaPredictor;
    private final EtaWebSocketHandler etaWs;
    private final ObjectMapper        objectMapper = new ObjectMapper();

    public GPSListener(
            BusStateTracker tracker,
            EtaPredictor predictor,
            EtaWebSocketHandler etaWs
    ) {
        super(URI.create("ws://localhost:8765"));
        this.busStateTracker = tracker;
        this.etaPredictor    = predictor;
        this.etaWs           = etaWs;
    }

    @Override
    public void onOpen(ServerHandshake hs) {
        System.out.println("✅ Connected to GPS Simulator WebSocket");
    }

    @Override
    public void onMessage(String message) {
        try {
            /* 1️⃣ Parse raw ping ------------------------------------------------ */
            BusPing ping = objectMapper.readValue(message, BusPing.class);
            long nowSec  = System.currentTimeMillis() / 1000;

            if (ping.getBusId() == null || ping.getLat() == 0) return;
            if (nowSec - ping.getTimestamp() > 120) return;         // >2-min delay
            if (!busStateTracker.isNewer(ping))      return;

            /* 2️⃣ Update trackers & ETA ---------------------------------------- */
            busStateTracker.updateBusState(ping);
            BusState state = busStateTracker.getState(ping.getBusId());
            etaPredictor.updateEta(state);                          // Kalman, etc.

            /* 3️⃣ Build view object & broadcast ------------------------------- */
            Map<String, Object> view = Map.of(
                    "busId",        state.getBusId(),
                    "lat",          state.getLat(),          // already smoothed
                    "lon",          state.getLon(),
                    "timestamp",    state.getLastUpdated(),
                    "arrivedStops", state.getArrivedStops(),  // HashSet<String>
                    "arrivalTimes", state.getArrivalTimes()
            );
            System.out.println("GPSListener sending view JSON: " + objectMapper.writeValueAsString(view));
            etaWs.broadcastEtaUpdate(objectMapper.writeValueAsString(view));

        } catch (Exception e) {
            System.err.println("❌ Failed to handle GPS ping: " + e.getMessage());
        }
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        System.out.println("⚠️ GPS WebSocket closed: " + reason);
    }

    @Override
    public void onError(Exception ex) {
        System.out.println("❗ GPS WebSocket error: " + ex.getMessage());
    }
}