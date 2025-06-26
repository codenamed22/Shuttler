package com.ivez.etaengine.dispatcher;

import com.ivez.etaengine.model.EtaPrediction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketDispatcher {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebSocketDispatcher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Send ETA list to all clients listening to /topic/etas
    public void dispatchEtas(List<EtaPrediction> predictions) {
        messagingTemplate.convertAndSend("/topic/etas", predictions);
    }
}
