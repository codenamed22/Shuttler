package com.ivez.etaengine.service;

import com.ivez.etaengine.model.BusPing;
import com.ivez.etaengine.model.BusState;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

// This service keeps track of each bus’s latest location, speed, and time
@Service
public class BusStateTracker {

    // Stores the latest state of each bus using busId as the key
    private final Map<String, BusState> stateMap = new HashMap<>();

    public void updateBusState(BusPing ping) {
        // Get previous state (if any)
        BusState previous = stateMap.get(ping.getBusId());

        double speed = 0;

        if (previous != null) {
            // Calculate time difference in seconds
            double timeDiff = (ping.getTimestamp() - previous.getLastUpdated()) / 1000.0;

            if (timeDiff > 0) {
                // Estimate distance between old and new point
                double distance = com.ivez.etaengine.util.GeoUtils.haversine(
                        previous.getLat(), previous.getLon(),
                        ping.getLat(), ping.getLon()
                );

                // Speed = distance / time (m/s)
                speed = distance / timeDiff;
            }
        }

        // Update bus state with new location and calculated speed
        BusState newState = new BusState(
                ping.getBusId(),
                ping.getLat(),
                ping.getLon(),
                speed,
                ping.getTimestamp()
        );

        stateMap.put(ping.getBusId(), newState);
    }

    // Get a single bus's state
    public BusState getState(String busId) {
        return stateMap.get(busId);
    }

    // Get all current bus states
    public Map<String, BusState> getAllStates() {
        return stateMap;
    }
}
