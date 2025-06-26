package com.ivez.etaengine.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Stop {
    private String stopId;
    private String name;
    private double lon;
    private double lat;
    private int segmentIndex;



    public Stop(String stopId, String name, double lon, double lat) {
        this.stopId = stopId;
        this.name = name;
        this.lat = lat;
        this.lon = lon;
    }

}
