package com.ivez.etaengine.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivez.etaengine.model.*;
import com.ivez.etaengine.repository.EtaPredictionRepository;
import com.ivez.etaengine.repository.StopArrivalRepository;
import com.ivez.etaengine.util.GeoUtils;
import com.ivez.etaengine.util.KalmanFilter;
import com.ivez.etaengine.ws.EtaWebSocketHandler;
import org.springframework.stereotype.Service;

import java.sql.SQLOutput;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static com.ivez.etaengine.util.GeoUtils.haversine;

@Service
public class EtaPredictor {

    private final Map<String, List<EtaPrediction>> predictionMap = new ConcurrentHashMap<>();
    private final Map<String, KalmanFilter> filters = new HashMap<>();
    //private final List<Stop> stops;
    private final Routes routes;
    private final EtaWebSocketHandler etaWebSocketHandler;
    private final EtaPredictionRepository predictionRepository;
    //private final StopArrivalRepository arrivalRepository;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss")
            .withZone(ZoneId.systemDefault());

    // Tuning thresholds
    private static final double MIN_SPEED = 0.5; // m/s
    private static final double MAX_SPEED = 20; // m/s
    private static final int MIN_ETA_UPDATE = 5000; // 5 secs
    //private static final int MAX_ETA_JUMP_SEC = 3000; // 5 minutes

    public EtaPredictor(Routes routes, EtaWebSocketHandler etaWebSocketHandler,
                        EtaPredictionRepository predictionRepository) {
        this.routes = routes;
        this.etaWebSocketHandler = etaWebSocketHandler;
        this.predictionRepository = predictionRepository;
        //this.arrivalRepository = arrivalRepository;
    }

    public void updateEta(BusState busState) throws JsonProcessingException {

        long now = System.currentTimeMillis();
        List<EtaPrediction> prevPrediction = predictionMap.get(busState.getBusId());
        if(prevPrediction != null)
            System.out.println("Time Diff : " + (now - prevPrediction.get(0).getLastUpdated()));
        if(prevPrediction != null && now - prevPrediction.get(0).getLastUpdated() < MIN_ETA_UPDATE) {
            System.out.println("Prediction Skipped!!");
            return;
        }

        RouteData route = routes.getRoute(busState.getBusId());
        List<Coordinate> path = route.getCoordinates();
        List<Stop> stops = route.getStops();
        int currentSegment = busState.getSegmentIndex();
        //System.out.println("Current Segment: " + currentSegment);

        double currLat = busState.getLat();
        double currLon = busState.getLon();
        double speed = Math.min(busState.getSpeed(), MAX_SPEED);

        if (speed < MIN_SPEED) {
            System.out.printf("⚠️ Low speed (%.2f m/s) — retaining previous ETA for %s%n", speed, busState.getBusId());
            return;
        }

        List<EtaPrediction> newPredictions = new ArrayList<>();
        List<String> etaLogs = new ArrayList<>();


        for (int i = 0; i < stops.size(); i++) {
            Stop stop = stops.get(i);

            if(busState.getArrivedStops().contains(stop.getStopId())){
                newPredictions.add(new EtaPrediction(busState.getBusId(), stop.getStopId(), -1, now));
                continue;
            }

            int stopSegment = stop.getSegmentIndex();
            System.out.println("Stop segment : " + stopSegment);
            double distance;

            if (stopSegment >= currentSegment) {
                distance = computeDistance(path, currentSegment, stopSegment);
            } else {
                // Loop around (if circular route)
                distance = computeDistance(path, currentSegment, path.size() - 1)
                        + computeDistance(path, 0, stopSegment);
            }
            double rawEtaSeconds = distance / speed;

            String filterKey = busState.getBusId() + "_stop" + (i+1);
            KalmanFilter filter = filters.computeIfAbsent(filterKey,
                    key -> new KalmanFilter(rawEtaSeconds, 1, 0.5, 5));

            double prevEstimate = filter.getEstimate();
            double smoothedEta = filter.update(rawEtaSeconds);

//            if (Math.abs(smoothedEta - prevEstimate) > MAX_ETA_JUMP_SEC) {
//                smoothedEta = prevEstimate;
//                System.out.println("🛑 ETA jump suppressed for " + filterKey);
//            }

            long etaMillis = now + (long) (smoothedEta * 1000);
            String etaStr = formatter.format(Instant.ofEpochMilli(etaMillis));
            etaLogs.add(etaStr);

            newPredictions.add(new EtaPrediction(busState.getBusId(), stop.getStopId(), etaMillis, now));
            System.out.printf("🕐 ETA → %-18s (%s): %s (filtered)%n", stop.getName(), stop.getStopId(), etaStr);

            com.ivez.etaengine.entity.EtaPrediction prediction = new com.ivez.etaengine.entity.EtaPrediction();
            prediction.setBusId(busState.getBusId());
            prediction.setStopId(stop.getStopId());
            prediction.setStopName(stop.getName());
            LocalDateTime predictedTime = Instant.ofEpochMilli(etaMillis)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime();
            prediction.setPredictedArrivalTime(predictedTime);
            prediction.setCreatedAt(LocalDateTime.now());
            prediction.setDate(predictedTime.toLocalDate());
            predictionRepository.save(prediction);
        }

        if (!newPredictions.isEmpty()) {
            predictionMap.put(busState.getBusId(), newPredictions);


            EtaUpdateDTO etaUpdate = new EtaUpdateDTO();
            etaUpdate.setBusId(busState.getBusId());
            Map<String, Long> temp = new HashMap<>();
            for( EtaPrediction eta : newPredictions){
                temp.put(eta.getStopId(),eta.getEtaTimestamp());
            }
            etaUpdate.setEtaPerStop(temp);
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(etaUpdate);
            System.out.println("EtaPredictor sending ETA JSON: " + json);
            etaWebSocketHandler.broadcastEtaUpdate(json);


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

    private double computeDistance(List<Coordinate> path, int from, int to) {
        double sum = 0;
        for (int i = from; i < to; i++) {
            Coordinate a = path.get(i);
            Coordinate b = path.get(i + 1);
            sum += haversine(a.getLat(), a.getLon(), b.getLat(), b.getLon());
        }
        return sum;
    }
}
