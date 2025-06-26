package com.ivez.etaengine.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusState {
    private String busId;
    private double lat;
    private double lon;
    private double speed; // in m/s

    @JsonProperty("timestamp")
    private long lastUpdated;
}
