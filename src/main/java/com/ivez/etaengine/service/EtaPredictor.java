package com.ivez.etaengine.service;

import com.ivez.etaengine.model.BusState;
import com.ivez.etaengine.model.EtaPrediction;
import com.ivez.etaengine.model.Stop;
import com.ivez.etaengine.util.GeoUtils;
import com.ivez.etaengine.util.KalmanFilter;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EtaPredictor {

    private final Map<String, List<EtaPrediction>> predictionMap = new HashMap<>();
    private final Map<String, KalmanFilter> filters = new HashMap<>();
    private final List<Stop> stops;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss")
            .withZone(ZoneId.systemDefault());

    // Tuning thresholds
    private static final double MIN_SPEED = 0.5; // m/s
    private static final double MAX_SPEED = 30.0; // m/s
    private static final int MAX_ETA_JUMP_SEC = 300; // 5 minutes

    public EtaPredictor(List<Stop> stops) {
        this.stops = stops;
    }

    public void updateEta(BusState busState) {
        double currLat = busState.getLat();
        double currLon = busState.getLon();
        double speed = Math.max(MIN_SPEED, Math.min(busState.getSpeed(), MAX_SPEED));

        if (speed < MIN_SPEED) {
            System.out.printf("⚠️ Low speed (%.2f m/s) — retaining previous ETA for %s%n", speed, busState.getBusId());
            return;
        }

        List<EtaPrediction> newPredictions = new ArrayList<>();
        List<String> etaLogs = new ArrayList<>();
        long now = System.currentTimeMillis();

        for (int i = 0; i < stops.size(); i++) {
            Stop stop = stops.get(i);
            double distance = GeoUtils.haversine(currLat, currLon, stop.getLat(), stop.getLon());
            double rawEtaSeconds = distance / speed;

            String filterKey = busState.getBusId() + "_stop" + i;
            KalmanFilter filter = filters.computeIfAbsent(filterKey,
                    key -> new KalmanFilter(rawEtaSeconds, 1, 0.5, 5));

            double prevEstimate = filter.getEstimate();
            double smoothedEta = filter.update(rawEtaSeconds);

            if (Math.abs(smoothedEta - prevEstimate) > MAX_ETA_JUMP_SEC) {
                smoothedEta = prevEstimate;
                System.out.println("🛑 ETA jump suppressed for " + filterKey);
            }

            long etaMillis = now + (long) (smoothedEta * 1000);
            String etaStr = formatter.format(Instant.ofEpochMilli(etaMillis));
            etaLogs.add(etaStr);

            newPredictions.add(new EtaPrediction(busState.getBusId(), stop.getStopId(), etaMillis));
            System.out.printf("🕐 ETA → %-18s (%s): %s (filtered)%n", stop.getName(), stop.getStopId(), etaStr);
        }

        if (!newPredictions.isEmpty()) {
            predictionMap.put(busState.getBusId(), newPredictions);
            System.out.printf("📍 Bus: %s | Speed: %.2f m/s | ETAs: %s%n",
                    busState.getBusId(), speed, String.join(" | ", etaLogs));
            System.out.println("✅ Stored predictions for " + busState.getBusId());
        } else {
            System.out.println("⚠️ No valid predictions generated for " + busState.getBusId());
        }
    }

    public List<EtaPrediction> getPredictions(String busId) {
        List<EtaPrediction> preds = predictionMap.get(busId);
        System.out.println("📦 Returning predictions for " + busId + ": " + (preds != null ? preds : "[]"));
        return preds != null ? preds : Collections.emptyList();
    }
}
