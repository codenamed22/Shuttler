package com.ivez.etaengine.dto;

public record BusPingView(
        String busId,
        double lat,       // **smoothed** latitude
        double lon,       // **smoothed** longitude
        long   timestamp,
        int    stopIndex  // current/next stop for gray-out
) {}
