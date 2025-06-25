package com.ivez.etaengine.service;

import com.ivez.etaengine.model.BusPing;
import com.ivez.etaengine.model.BusState;
import com.ivez.etaengine.model.EtaPrediction;
import com.ivez.etaengine.util.GeoUtils;
import com.ivez.etaengine.util.MovingAverageFilter;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class EtaPredictor {

    // Each busId → ETA predictions for stops
    private final Map<String, List<EtaPrediction>> predictionMap = new HashMap<>();

    // Smoothing window (in seconds) for moving average
    private static final int SMOOTHING_WINDOW = 5;

    // Define upcoming stops for now (mocked)
    private static final List<double[]> STOPS = List.of(
            new double[]{19.0730, 72.8828}, // Stop A
            new double[]{19.0751, 72.8845}, // Stop B
            new double[]{19.0775, 72.8860}  // Stop C
    );

    // Each (busId + stop index) → smoothing filter
    private final Map<String, MovingAverageFilter> filters = new HashMap<>();

    // Called when a new bus state update is available
    public void updateEta(BusState busState) {
        List<EtaPrediction> predictions = new ArrayList<>();

        double currLat = busState.getLat();
        double currLon = busState.getLon();
        double speed = busState.getSpeed(); // in m/s

        // Safety check: skip if speed is zero or too low
        if (speed < 1e-3) return;

        for (int i = 0; i < STOPS.size(); i++) {
            double[] stop = STOPS.get(i);

            // Calculate distance to this stop (in meters)
            double distance = GeoUtils.haversine(currLat, currLon, stop[0], stop[1]);

            // Basic ETA = distance / speed
            double rawEtaSeconds = distance / speed;

            // Apply moving average smoothing
            String filterKey = busState.getBusId() + "_stop" + i;
            filters.putIfAbsent(filterKey, new MovingAverageFilter(SMOOTHING_WINDOW));
            double smoothedEta = filters.get(filterKey).addAndGetAverage(rawEtaSeconds);

            // Build prediction object
            EtaPrediction prediction = new EtaPrediction(
                    busState.getBusId(),
                    "Stop_" + (i + 1),
                    System.currentTimeMillis() + (long)(smoothedEta * 1000) // ETA time
            );

            predictions.add(prediction);
        }

        // Store latest predictions
        predictionMap.put(busState.getBusId(), predictions);
    }

    // To expose to frontend/debug
    public List<EtaPrediction> getPredictions(String busId) {
        return predictionMap.getOrDefault(busId, new ArrayList<>());
    }
}
