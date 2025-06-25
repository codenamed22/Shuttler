package com.ivez.etaengine.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Represents current state of a bus
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusState {
    private String busId;
    private double lat;
    private double lon;
    private double speed; // in m/s
    private long lastUpdated;
}
