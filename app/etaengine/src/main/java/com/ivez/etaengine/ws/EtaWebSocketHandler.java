package com.ivez.etaengine.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class EtaWebSocketHandler extends TextWebSocketHandler {
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("[CONNECTED] " + session.getId() + ", Total: " + sessions.size());
        System.out.println("Handler instance: " + this);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("[DISCONNECTED] " + session.getId() + " (" + status + ")");
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("⚠️ WebSocket error on session " + session.getId() + ": " + exception.getMessage());
        sessions.remove(session);
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    public void broadcastEtaUpdate(String etaJson) {
        System.out.println("[BROADCASTING] to " + sessions.size() + " clients");
        System.out.println("Handler instance: " + this);

        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                sessions.remove(session);
                continue;
            }

            try {
                session.sendMessage(new TextMessage(etaJson));
            } catch (IOException e) {
                System.err.println("❌ Failed to send to session " + session.getId() + ": " + e.getMessage());
                sessions.remove(session);
                try {
                    session.close(CloseStatus.SERVER_ERROR);
                } catch (IOException ignore) {}
            }
        }
    }

    @PostConstruct
    public void init() {
        System.out.println("Handler instance: " + this);
    }
}