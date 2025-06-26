package com.ivez.etaengine.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivez.etaengine.model.BusState;
import com.ivez.etaengine.service.EtaPredictor;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;

public class BusWebSocketClient extends WebSocketClient {

    private final EtaPredictor etaPredictor;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BusWebSocketClient(URI serverUri, EtaPredictor etaPredictor) {
        super(serverUri);
        this.etaPredictor = etaPredictor;
    }

    @Override
    public void onOpen(ServerHandshake handshake) {
        System.out.println("✅ Connected to Python WebSocket Server");
    }

    @Override
    public void onMessage(String message) {
        try {
            BusState busState = objectMapper.readValue(message, BusState.class);
            etaPredictor.updateEta(busState);
            System.out.println("Received ping for bus: " + busState.getBusId());
        } catch (Exception e) {
            System.err.println("❌ Failed to parse message: " + message);
            e.printStackTrace();
        }
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        System.out.println("🔌 WebSocket closed: " + reason);
    }

    @Override
    public void onError(Exception ex) {
        System.err.println("❗ WebSocket error: " + ex.getMessage());
        ex.printStackTrace();
    }
}
