package com.ivez.etaengine.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
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
    }

    public void broadcastEtaUpdate(String etaJson) {
        System.out.println("[BROADCASTING] to " + sessions.size() + " clients");
        System.out.println("Handler instance: " + this);
        for (WebSocketSession session : sessions) {
            try {
                session.sendMessage(new TextMessage(etaJson));
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @PostConstruct
    public void init() {
        System.out.println("Handler instance: " + this);
    }

}
