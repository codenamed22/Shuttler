package com.ivez.etaengine.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusState {
    private String busId;
    private double lat;
    private double lon;
    private double speed; // in m/s
    private int segmentIndex;
    private Set<String> arrivedStops = new HashSet<>();

    @JsonProperty("timestamp")
    private long lastUpdated;
}
