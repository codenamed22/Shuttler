package com.ivez.etaengine.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Represents a raw GPS ping from the simulator
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusPing {
    private String busId;
    private double lat;
    private double lon;
    private long timestamp;
}
