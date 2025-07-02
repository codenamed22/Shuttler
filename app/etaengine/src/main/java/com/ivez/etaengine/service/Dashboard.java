package com.ivez.etaengine.service;

import com.ivez.etaengine.dto.StopEtaResponse;
import com.ivez.etaengine.entity.EtaPrediction;
import com.ivez.etaengine.entity.StopArrival;
import com.ivez.etaengine.repository.EtaPredictionRepository;
import com.ivez.etaengine.repository.StopArrivalRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class Dashboard {

    private final StopArrivalRepository arrivalRepository;
    private final EtaPredictionRepository predictionRepository;

    public Dashboard(StopArrivalRepository arrivalRepository, EtaPredictionRepository predictionRepository){
        this.arrivalRepository = arrivalRepository;
        this.predictionRepository = predictionRepository;
    }

    public List<StopEtaResponse> getDashboardData(String busId, LocalDate date)
    {
        List<StopArrival> arrivals = arrivalRepository.findByBusIdAndDate(busId, date);

        List<StopEtaResponse> responseList = new ArrayList<>();
        for(StopArrival arrival : arrivals){
            List<EtaPrediction> predictions = predictionRepository.findByBusIdAndStopIdAndDate(busId,
                    arrival.getStopId(), date);
            // Filter predictions made before the actual arrival
            List<EtaPrediction> beforeArrival = predictions.stream()
                    .filter(p -> p.getCreatedAt().isBefore(arrival.getArrivalTime()))
                    .collect(Collectors.toList());

            LocalDateTime actual = arrival.getArrivalTime();
            StopEtaResponse response = new StopEtaResponse();
            response.setBusId(busId);
            response.setStopId(arrival.getStopId());
            response.setStopName(arrival.getStopName());
            response.setActualArrival(actual);
            response.setEta5minBefore(closestEta(beforeArrival, actual, 5));
            response.setEta3minBefore(closestEta(beforeArrival, actual, 3));
            response.setEta2minBefore(closestEta(beforeArrival, actual, 2));

            responseList.add(response);
        }

        return responseList;
    }

    private LocalDateTime closestEta(List<EtaPrediction> predictions, LocalDateTime arrivalTime, int minutesBefore) {
        return predictions.stream()
                .min(Comparator.comparing(p -> Math.abs(
                        Duration.between(p.getCreatedAt(), arrivalTime).toMinutes() - minutesBefore)))
                .map(EtaPrediction::getPredictedArrivalTime)
                .orElse(null);
    }

}
