package com.ivez.etaengine.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

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

    /* 🆕 actual-arrival timestamps per stopId */
    private Map<String, Long> arrivalTimes = new ConcurrentHashMap<>();
    public Map<String, Long> getArrivalTimes() { return arrivalTimes; }

    @JsonProperty("timestamp")
    private long lastUpdated;
}