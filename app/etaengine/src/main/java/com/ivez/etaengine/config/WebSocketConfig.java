package com.ivez.etaengine.config;

import com.ivez.etaengine.ws.EtaWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final EtaWebSocketHandler etaWebSocketHandler;

    public WebSocketConfig(EtaWebSocketHandler etaWebSocketHandler) {
        this.etaWebSocketHandler = etaWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(etaWebSocketHandler, "/ws/eta")
                .setAllowedOrigins("*");
    }
}
