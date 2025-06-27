package com.ivez.etaengine.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivez.etaengine.model.BusPing;
import com.ivez.etaengine.model.Coordinate;
import com.ivez.etaengine.model.RouteData;
import com.ivez.etaengine.model.Stop;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.List;

// This service connects to the GPS simulator WebSocket and listens for pings
@Service
public class GPSListener extends WebSocketClient {

    private final BusStateTracker busStateTracker;
    private final EtaPredictor etaPredictor;
    private Routes routes;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Connect to simulator WebSocket URL
    public GPSListener(BusStateTracker tracker, EtaPredictor predictor, Routes routes) {
        super(URI.create("ws://localhost:8765"));
        ; // Change if simulator runs elsewhere
        this.busStateTracker = tracker;
        this.etaPredictor = predictor;
        this.routes = routes;
    }

    @Override
    public void onOpen(ServerHandshake handshakedata) {
        System.out.println("✅ Connected to GPS Simulator WebSocket");
    }

    @Override
    public void onMessage(String message) {
        try {
            // Convert JSON string to BusPing object
            BusPing ping = objectMapper.readValue(message, BusPing.class);
            long now = (System.currentTimeMillis()) / 1000;

            // Simple validation
            if (ping.getBusId() != null && ping.getLat() != 0) {

                RouteData route = routes.getRoute(ping.getBusId());
                if (route == null) {
                    System.err.println("Unknown busId: " + ping.getBusId());
                    return;
                }

                List<Coordinate> routeCoords = route.getCoordinates();
                List<Stop> stops = route.getStops();

                if(!busStateTracker.isNewer(ping)){
                    System.out.println("Stale ping ignored for bus: " + ping.getBusId());
                    return;
                }
                System.out.println("Time Diff : " + (now - ping.getTimestamp()));
                if ((now - ping.getTimestamp()) > 2 * 60 * 1000) {
                    System.out.println("Ping too delayed, skipping: " + ping.getBusId());
                    return;
                }

                busStateTracker.updateBusState(ping); // Track bus
                etaPredictor.updateEta(busStateTracker.getState(ping.getBusId())); // Predict ETA
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to parse GPS ping: " + e.getMessage());
        }
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        System.out.println("⚠️ GPS WebSocket closed: " + reason);
    }

    @Override
    public void onError(Exception ex) {
        System.out.println("❗ Error in GPS WebSocket: " + ex.getMessage());
    }
}
