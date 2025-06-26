package com.ivez.etaengine.config;

import com.ivez.etaengine.service.EtaPredictor;
import com.ivez.etaengine.ws.BusWebSocketClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.net.URI;

@Configuration
public class WebSocketClientConfig {

    @Autowired
    private EtaPredictor etaPredictor;

    @PostConstruct
    public void startPythonWsClient() {
        try {
            URI uri = new URI("ws://localhost:8765"); // Python WebSocket server
            BusWebSocketClient client = new BusWebSocketClient(uri, etaPredictor);
            client.connect();
        } catch (Exception e) {
            System.err.println("❌ Failed to connect to Python WS server: " + e.getMessage());
        }
    }
}
