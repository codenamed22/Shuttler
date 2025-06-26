package com.ivez.etaengine.model;

public class Stop {
    private String stopId;
    private String name;
    private double lon;
    private double lat;

    public Stop() {
    }

    public Stop(String stopId, String name, double lat, double lon) {
        this.stopId = stopId;
        this.name = name;
        this.lat = lat;
        this.lon = lon;
    }

    public String getStopId() {
        return stopId;
    }

    public String getName() {
        return name;
    }

    public double getLat() {
        return lat;
    }

    public double getLon() {
        return lon;
    }
}
