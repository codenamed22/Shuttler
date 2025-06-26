package com.ivez.etaengine.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Prediction for one bus-stop pair
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtaPrediction {
    private String busId;
    private String stopId;
    private long etaTimestamp;// ETA in epoch millis
    private long lastUpdated;
}
