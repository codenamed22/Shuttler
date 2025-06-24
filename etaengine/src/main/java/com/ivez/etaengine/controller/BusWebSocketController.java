package com.ivez.etaengine.controller;

import com.ivez.etaengine.model.EtaPrediction;
import com.ivez.etaengine.service.EtaPredictor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eta")
public class BusWebSocketController {

    private final EtaPredictor etaPredictor;

    @Autowired
    public BusWebSocketController(EtaPredictor etaPredictor) {
        this.etaPredictor = etaPredictor;
    }

    // Returns ETA predictions for a given busId
    @GetMapping("/{busId}")
    public List<EtaPrediction> getEtas(@PathVariable String busId) {
        return etaPredictor.getPredictions(busId);
    }
}
